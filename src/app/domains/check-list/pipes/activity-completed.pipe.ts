import { Pipe, PipeTransform } from '@angular/core';
import { CompletedActivity } from '../models/control-api.models';

@Pipe({
  name: 'activityCompleted',
  standalone: true,
  pure: true // Garantiza que el pipe solo se ejecuta cuando sus inputs cambian
})
export class ActivityCompletedPipe implements PipeTransform {
  /**
   * Checks if a specific activity is completed on a given day
   * @param idControl The control ID to check (can be undefined)
   * @param day The day number to check
   * @param completedActivities List of completed activities
   * @returns Boolean indicating whether the activity is completed on the specified day
   */
  transform(idControl: string | undefined, day: number, completedActivities: CompletedActivity[]): boolean {
    
    console.log('Checking activity completion for:', {
      idControl,
      day,
      completedActivities
    });
    if (!completedActivities || completedActivities.length === 0 || !idControl) {
      return false;
    }

    // Convert day to string for comparison since API returns Dia as string
    const dayStr = String(day);
    
    // Check if the activity with this idControl is completed on this day
    let result = completedActivities.some(item => 
      item.IdControl === idControl && item.Dia === dayStr
    );
    console.log('Result:', result);
    return result;
  }
}
