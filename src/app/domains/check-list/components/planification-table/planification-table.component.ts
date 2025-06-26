import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
}

@Component({
  selector: 'app-planification-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './planification-table.component.html',
  styleUrls: ['./planification-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PlanificationTableComponent implements OnInit, OnChanges {
  constructor(private cdr: ChangeDetectorRef) {}
  @Input() set activities(data: Activity[]) {
    console.log('Planification Table received activities:', data);
    this._activities = data;
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
}
