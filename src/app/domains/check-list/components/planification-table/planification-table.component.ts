import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  styleUrl: './planification-table.component.scss'
})
export class PlanificationTableComponent {
  @Input() activities: Activity[] = [];
  @Input() days: number[] = [];
  @Input() selectedPeriod: Date | null = null;
  
  @Output() activityStatusChanged = new EventEmitter<{activity: Activity, day: number}>();
  @Output() saveChanges = new EventEmitter<void>();
  
  /**
   * Group activities by ámbito/scope
   */
  get groupedActivities(): {ambito: string, activities: Activity[]}[] {
    const groupedMap = new Map<string, Activity[]>();
    
    // Ensure every activity has an ámbito, default to 'SIN CLASIFICAR' if not present
    this.activities.forEach(activity => {
      const ambito = activity.ambito || 'SIN CLASIFICAR';
      if (!groupedMap.has(ambito)) {
        groupedMap.set(ambito, []);
      }
      groupedMap.get(ambito)!.push(activity);
    });
    
    // Convert map to array for template iteration
    return Array.from(groupedMap).map(([ambito, activities]) => ({ 
      ambito: ambito, 
      activities: activities 
    }));
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
