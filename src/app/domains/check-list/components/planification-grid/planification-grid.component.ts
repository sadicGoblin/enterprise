import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProxyService } from '../../../../core/services/proxy.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ChecklistReportModalComponent } from '../checklist-report-modal/checklist-report-modal.component';
import { SstmaModalComponent } from '../sstma-modal/sstma-modal.component';
import { ARTViewModalComponent } from '../planification-table/components/art-view-modal/art-view-modal.component';
import { environment } from '../../../../../environments/environment';

// Interface for simplified API response
export interface PlanificacionSimpleItem {
  idForm: string;
  IdControl: string;
  fecha: string;
  Obra: string;
  IdUsuario: string;
  Usuario: string;
  Periodo: string;
  EtapaConst: string;
  SubProceso: string;
  Ambito: string;
  Actividad: string;
  Periodicidad: string;
  idCategoria: string;
  idParam: string;
  dia: string;
  diaCompletado: string;
  tipo: string;
  sticker: string;
  estado: string;
}

// Interface for grouped activity display
export interface GridActivity {
  id: number;
  idControl: string;
  name: string;
  subProcess: string;
  activityName: string;
  periodicity: string;
  ambit: string;
  idParam: string;
  tipo: string;
  // Daily status map: day number -> status
  dayStatus: Map<number, 'no cumplida' | 'cumplida' | 'pendiente' | 'none'>;
  // Metrics
  assigned: number;
  realized: number;
  compliance: number;
}

@Component({
  selector: 'app-planification-grid',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDialogModule, 
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './planification-grid.component.html',
  styleUrls: ['./planification-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PlanificationGridComponent implements OnInit, OnChanges {
  
  constructor(
    private cdr: ChangeDetectorRef,
    private proxyService: ProxyService,
    private dialog: MatDialog
  ) {}
  
  // Input properties
  @Input() periodo: number | null = null;
  @Input() idUsuario: number | null = null;
  @Input() projectId: string | null = null;
  @Input() selectedCollaboratorName: string | null = null;
  @Input() selectedCollaboratorId: string | null = null;
  
  // Output events
  @Output() activityClicked = new EventEmitter<{activity: GridActivity, day: number}>();
  
  // Component state
  isLoading = false;
  rawData: PlanificacionSimpleItem[] = [];
  groupedActivities: {ambit: string, activities: GridActivity[]}[] = [];
  days: number[] = [];
  selectedPeriod: Date | null = null;
  
  // Summary totals
  totalAssigned = 0;
  totalRealized = 0;
  totalCompliancePercentage = 0;

  ngOnInit(): void {
    console.log('PlanificationGrid initialized');
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('PlanificationGrid changes:', changes);
    
    // When periodo or idUsuario changes, fetch new data
    if ((changes['periodo'] || changes['idUsuario']) && this.periodo && this.idUsuario) {
      this.fetchData();
    }
  }

  /**
   * Fetch data from the simplified API
   */
  fetchData(): void {
    if (!this.periodo || !this.idUsuario) {
      console.warn('Cannot fetch data: missing periodo or idUsuario');
      return;
    }

    console.log('Fetching planification data:', { periodo: this.periodo, idUsuario: this.idUsuario });
    this.isLoading = true;

    const requestBody = {
      caso: 'ControlPlanificacionUser',
      periodo: this.periodo,
      idUsuario: this.idUsuario
    };

    this.proxyService.post(environment.apiBaseUrl + '/ws/PlanificacionSvcImpl.php', requestBody)
      .pipe(
        catchError(error => {
          console.error('Error fetching planification data:', error);
          return of({ data: [] });
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe((response: any) => {
        console.log('API Response:', response);
        
        // Handle response - could be array directly or wrapped in data property
        if (Array.isArray(response)) {
          this.rawData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          this.rawData = response.data;
        } else {
          this.rawData = [];
        }

        console.log('Raw data items:', this.rawData.length);
        
        if (this.rawData.length > 0) {
          // Extract period to generate days
          this.extractPeriodInfo();
          // Process and group the data
          this.processData();
        }
        
        this.cdr.detectChanges();
      });
  }

  /**
   * Extract period information and generate days array
   */
  private extractPeriodInfo(): void {
    if (!this.periodo) return;

    const periodoStr = this.periodo.toString();
    const year = parseInt(periodoStr.substring(0, 4));
    const month = parseInt(periodoStr.substring(4, 6)) - 1; // JS months are 0-indexed

    this.selectedPeriod = new Date(year, month, 1);
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    this.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    console.log('Generated days array:', this.days.length, 'days for', year, month + 1);
  }

  /**
   * Process raw data into grouped activities
   */
  private processData(): void {
    // Reset groupedActivities
    this.groupedActivities = [];
    
    // Group by unique activity (using IdControl + SubProceso + Actividad as key)
    const activitiesMap = new Map<string, GridActivity>();
    
    this.rawData.forEach(item => {
      const uniqueKey = `${item.IdControl}_${item.SubProceso}_${item.Actividad}`;
      
      if (!activitiesMap.has(uniqueKey)) {
        const activity: GridActivity = {
          id: parseInt(item.IdControl) || 0,
          idControl: item.IdControl,
          name: `${item.SubProceso} :: ${item.Actividad}`,
          subProcess: item.SubProceso,
          activityName: item.Actividad,
          periodicity: item.Periodicidad,
          ambit: item.Ambito || 'SIN CLASIFICAR',
          idParam: item.idParam,
          tipo: item.tipo,
          dayStatus: new Map(),
          assigned: 0,
          realized: 0,
          compliance: 0
        };
        activitiesMap.set(uniqueKey, activity);
      }
      
      // Add day status
      const activity = activitiesMap.get(uniqueKey)!;
      const day = parseInt(item.dia);
      
      if (!isNaN(day) && day > 0) {
        // Determine status based on estado and diaCompletado
        let status: 'no cumplida' | 'cumplida' | 'pendiente' | 'none' = 'none';
        
        if (item.estado === 'cumplida' || item.diaCompletado === '1') {
          status = 'cumplida';
        } else if (item.estado === 'no cumplida' || item.estado === 'pendiente') {
          status = 'no cumplida';
        }
        
        activity.dayStatus.set(day, status);
      }
    });

    // Calculate metrics for each activity
    activitiesMap.forEach(activity => {
      let assigned = 0;
      let realized = 0;
      
      activity.dayStatus.forEach((status) => {
        if (status !== 'none') {
          assigned++;
          if (status === 'cumplida') {
            realized++;
          }
        }
      });
      
      activity.assigned = assigned;
      activity.realized = realized;
      activity.compliance = assigned > 0 ? Math.round((realized / assigned) * 100) : 0;
    });

    // Group by ambit
    const ambitGroups = new Map<string, GridActivity[]>();
    
    activitiesMap.forEach(activity => {
      const ambit = activity.ambit;
      if (!ambitGroups.has(ambit)) {
        ambitGroups.set(ambit, []);
      }
      ambitGroups.get(ambit)!.push(activity);
    });

    // Convert to array format and sort
    ambitGroups.forEach((activities, ambit) => {
      // Sort activities by name within each group
      activities.sort((a, b) => a.name.localeCompare(b.name));
      this.groupedActivities.push({ ambit, activities });
    });

    // Sort groups by ambit name
    this.groupedActivities.sort((a, b) => a.ambit.localeCompare(b.ambit));

    // Calculate totals
    this.calculateTotals();

    console.log('Processed', activitiesMap.size, 'unique activities into', this.groupedActivities.length, 'groups');
  }

  /**
   * Calculate totals for the summary row
   */
  private calculateTotals(): void {
    this.totalAssigned = 0;
    this.totalRealized = 0;

    this.groupedActivities.forEach(group => {
      group.activities.forEach(activity => {
        this.totalAssigned += activity.assigned;
        this.totalRealized += activity.realized;
      });
    });

    this.totalCompliancePercentage = this.totalAssigned > 0 
      ? Math.round((this.totalRealized / this.totalAssigned) * 100) 
      : 0;
  }

  /**
   * Check if a day is a weekend
   */
  isWeekend(day: number): boolean {
    if (!this.selectedPeriod) return false;
    
    const date = new Date(
      this.selectedPeriod.getFullYear(), 
      this.selectedPeriod.getMonth(), 
      day
    );
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Get abbreviated day of week in Spanish
   */
  getDayOfWeekAbbr(day: number): string {
    if (!this.selectedPeriod) return '';
    
    const date = new Date(
      this.selectedPeriod.getFullYear(), 
      this.selectedPeriod.getMonth(), 
      day
    );
    const dayOfWeek = date.getDay();
    const dayAbbreviations = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    return dayAbbreviations[dayOfWeek];
  }

  /**
   * Get the status for an activity on a specific day
   */
  getDayStatus(activity: GridActivity, day: number): 'no cumplida' | 'cumplida' | 'pendiente' | 'none' {
    return activity.dayStatus.get(day) || 'none';
  }

  /**
   * Check if activity is completed for a specific day
   */
  isActivityCompleted(activity: GridActivity, day: number): boolean {
    return this.getDayStatus(activity, day) === 'cumplida';
  }

  /**
   * Check if activity is assigned for a specific day
   */
  isActivityAssigned(activity: GridActivity, day: number): boolean {
    const status = this.getDayStatus(activity, day);
    return status === 'no cumplida' || status === 'cumplida';
  }

  /**
   * Handle click on status icon
   */
  onStatusClick(activity: GridActivity, day: number): void {
    // Only allow click if activity is completed
    if (!this.isActivityCompleted(activity, day)) {
      return;
    }

    console.log('Status clicked:', activity.activityName, 'day:', day);

    // Determine which modal to open based on activity type
    if (activity.activityName.includes('INSPECCION SSOMA') || activity.activityName.includes('INSPECCION SSTMA')) {
      console.log('Opening SSTMA modal with idControl:', activity.idControl, 'day:', day);
      this.dialog.open(SstmaModalComponent, {
        data: { 
          idControl: activity.idControl, 
          day: day 
        }
      });
    } else if (activity.activityName.includes('CHECK LIST') || activity.tipo === 'CHECK-LIST') {
      console.log('Opening Checklist modal with idControl:', activity.idControl, 'day:', day);
      this.dialog.open(ChecklistReportModalComponent, {
        data: { 
          idControl: activity.idControl, 
          day: day 
        }
      });
    } else {
      console.log('Opening ART modal with idControl:', activity.idControl, 'day:', day);
      this.dialog.open(ARTViewModalComponent, {
        width: '90vw',
        maxWidth: '900px',
        height: 'auto',
        maxHeight: '90vh',
        data: { 
          activityId: activity.id,
          projectId: this.projectId,
          idControl: activity.idControl,
          day: day,
          idParam: activity.idParam,
          name: activity.activityName
        }
      });
    }

    // Emit event
    this.activityClicked.emit({ activity, day });
  }

  /**
   * Get icon based on day status
   */
  getStatusIcon(activity: GridActivity, day: number): string {
    const status = this.getDayStatus(activity, day);
    
    if (status === 'cumplida') {
      return 'check_circle';
    } else if (status === 'no cumplida') {
      return 'check_circle_unread';
    }
    return 'check_circle';
  }

  /**
   * Get CSS class for status icon
   */
  getStatusClass(activity: GridActivity, day: number): string {
    const status = this.getDayStatus(activity, day);
    
    switch (status) {
      case 'cumplida':
        return 'status-completed';
      case 'no cumplida':
        return 'status-assigned';
      default:
        return 'status-disabled';
    }
  }

  /**
   * Get CSS class for the cell based on status
   */
  getCellClass(activity: GridActivity, day: number): string {
    const status = this.getDayStatus(activity, day);
    
    let classes = '';
    if (status === 'cumplida') {
      classes = 'day-completed';
    } else if (status === 'no cumplida') {
      classes = 'day-assigned';
    }
    
    if (this.isWeekend(day)) {
      classes += ' weekend-column';
    }
    
    return classes;
  }

  /**
   * Format periodicity for display
   */
  formatPeriodicity(periodicity: string): string {
    switch (periodicity?.toUpperCase()) {
      case 'SEMANAL':
        return 'Semanal';
      case 'QUINCENAL':
        return 'Quincenal';
      case 'DIARIAS':
        return 'Diarias';
      case 'MENSUAL':
        return 'Mensual';
      default:
        return periodicity || 'Mensual';
    }
  }

  /**
   * Reload data from API
   */
  reload(): void {
    this.fetchData();
  }
}
