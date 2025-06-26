import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProxyService } from '../../../../core/services/proxy.service';
import { CompletionApiRequest, CompletionApiResponse, CompletedActivity } from '../../models/control-api.models';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivityCompletedPipe } from '../../pipes/activity-completed.pipe';

// Interface for Activity
export interface Activity {
  id: number;
  name: string;
  periodicity: string;
  assigned: number;
  realized: number;
  compliance: number;
  scheduledDays: number[];
  completedDays?: number[];
  ambito?: string; // Category/scope of the activity
  idControl?: string; // Control ID for matching with completions API
}

@Component({
  selector: 'app-planification-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ActivityCompletedPipe],
  templateUrl: './planification-table.component.html',
  styleUrls: ['./planification-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PlanificationTableComponent implements OnInit, OnChanges {
  constructor(
    private cdr: ChangeDetectorRef,
    private proxyService: ProxyService
  ) {}
  
  // API endpoint for fetching completed activities
  private completionsApiEndpoint = '/ws/PlanificacionSvcImpl.php';
  
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
    return this._days;
  }

  @Input() set selectedPeriod(data: Date | null) {
    console.log('Planification Table received selectedPeriod:', data);
    this._selectedPeriod = data;
  }
  get selectedPeriod(): Date | null {
    return this._selectedPeriod;
  }

  private _activities: Activity[] = [];
  private _days: number[] = [];
  private _selectedPeriod: Date | null = null;
  
  @Output() activityStatusChanged = new EventEmitter<{activity: Activity, day: number}>();
  @Output() saveChanges = new EventEmitter<void>();
  
  /**
   * Group activities by ámbito/scope
   */
  groupedActivities: {ambito: string, activities: Activity[]}[] = [];

  /**
   * Group activities by ambito
   */
  /**
   * Updates the groupedActivities array by extracting unique ámbitos first 
   * and then grouping activities accordingly
   */
  updateGroupedActivities(): void {
    console.log('Updating grouped activities with:', this._activities);
    
    // Reset the grouped activities
    this.groupedActivities = [];
    
    // Default ambito for activities without one
    const defaultAmbito = 'SIN CLASIFICAR';
    
    // Handle possible undefined activities array
    if (!this._activities || this._activities.length === 0) {
      console.warn('No activities to group!');
      return;
    }
    
    // STEP 1: Extract all unique ámbitos from the activities
    const uniqueAmbitos = new Set<string>();
    
    this._activities.forEach(activity => {
      const ambito = activity.ambito || defaultAmbito;
      uniqueAmbitos.add(ambito);
    });
    
    console.log('Found unique ámbitos:', Array.from(uniqueAmbitos));
    
    // STEP 2: Create a group for each unique ámbito
    Array.from(uniqueAmbitos).forEach(ambito => {
      this.groupedActivities.push({ 
        ambito: ambito, 
        activities: [] 
      });
      console.log(`Created group for ámbito: "${ambito}"`);
    });
    
    // STEP 3: Assign activities to their corresponding groups
    this._activities.forEach(activity => {
      const ambito = activity.ambito || defaultAmbito;
      const group = this.groupedActivities.find(g => g.ambito === ambito);
      
      if (group) {
        group.activities.push(activity);
        console.log('# Group activities:', group.activities);
        console.log(`Added activity ${activity.id} (${activity.name}) to group "${ambito}"`);
      } else {
        console.warn(`Could not find group for ámbito "${ambito}"`);
      }
    });
    
    // STEP 4: Sort groups alphabetically by ambito
    this.groupedActivities.sort((a, b) => a.ambito.localeCompare(b.ambito));
    
    // STEP 5: Sort activities within each group by name
    this.groupedActivities.forEach(group => {
      group.activities.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    // Log summary information
    console.log(`Total activities: ${this._activities.length}, Total groups: ${this.groupedActivities.length}`);
    
    // Verify the data in each group
    this.groupedActivities.forEach((group, index) => {
      console.log(`Group ${index + 1}: ${group.ambito} - ${group.activities.length} activities`);
      if (group.activities.length > 0) {
        console.log(`  First activity: ${group.activities[0].name}`);
        console.log(`  Last activity: ${group.activities[group.activities.length - 1].name}`);
      }
    });
    
    // Force change detection
    this.cdr.detectChanges();
  }

  /**
   * Angular lifecycle hooks
   */
  ngOnInit() {
    console.log('PlanificationTable component initialized');
    console.log('Initial activities:', this._activities);
    console.log('Initial days:', this._days);
    console.log('Initial selectedPeriod:', this._selectedPeriod);
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
    
    // Create request body
    const requestBody: CompletionApiRequest = {
      caso: 'ConsultaPlanificacion',
      IdUsuario: userId,
      Periodo: period
    };
    
    console.log('API Request:', requestBody);
    
    // Call the API
    this.proxyService.post<CompletionApiResponse>(this.completionsApiEndpoint, requestBody)
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
        console.log('%c Completed activities API response saved:', 'color: blue; font-weight: bold', this.completedActivitiesApiResponse);
        console.log('%c Completed activities data saved:', 'color: green; font-weight: bold', this.completedActivities);
        console.table(this.completedActivities);
      });
  }
  
  /**
   * Updates the activities with completion status
   */
  updateActivitiesCompletionStatus(): void {
    if (this.completedActivities.length === 0 || this._activities.length === 0) {
      console.log('No completed activities or no activities to update');
      return;
    }
    
    // Create a map of IdControl to day for quick lookups
    const completionsMap = new Map<string, number[]>();
    
    // Group completed days by IdControl
    this.completedActivities.forEach(completion => {
      const day = Number(completion.Dia);
      if (!isNaN(day)) {
        const days = completionsMap.get(completion.IdControl) || [];
        days.push(day);
        completionsMap.set(completion.IdControl, days);
      }
    });
    
    console.log('Completions map created:', Array.from(completionsMap.entries()));
    
    // For each activity, check if we have any completions
    this._activities.forEach(activity => {
      // Reset completedDays array
      activity.completedDays = [];
      
      // Check if this activity has any completions
      // We need to match by IdControl which is not directly available in our activity object
      // This would require additional data mapping in a real implementation
      // For demonstration, we'll just use the first matching completion
      for (const [controlId, days] of completionsMap.entries()) {
        // In a real implementation, we would need a way to map from activity to IdControl
        // For now, we'll just add the days to the first activity as a demo
        activity.completedDays = [...days];
        break;
      }
      
      // Update activity metrics
      this.updateActivityMetrics(activity);
    });
    
    // Force change detection
    this.cdr.detectChanges();
  }
  
  /**
   * Updates metrics for an activity
   */
  updateActivityMetrics(activity: Activity): void {
    activity.assigned = activity.scheduledDays.length;
    activity.realized = activity.completedDays?.length || 0;
    activity.compliance = activity.assigned > 0 ? 
      Math.round((activity.realized / activity.assigned) * 100) : 0;
  }
}
