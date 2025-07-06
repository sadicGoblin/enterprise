import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SummaryCardComponent } from './summary-card.component';

@Component({
  selector: 'app-completed-activities-card',
  standalone: true,
  imports: [SummaryCardComponent],
  template: `
    <app-summary-card
      title="Actividades Completadas"
      [value]="completedActivities"
      icon="check_circle"
      iconBgColor="#10B981"
      [showTrend]="true"
      [trendValue]="trendValue"
      [trendDirection]="trendDirection"
      [trendPeriod]="trendPeriod">
    </app-summary-card>
  `
})
export class CompletedActivitiesCardComponent implements OnChanges {
  @Input() completedActivities: number = 0;
  @Input() previousPeriodCompleted: number = 0;
  @Input() trendPeriod: string = 'mes anterior';

  trendValue: number = 0;
  trendDirection: 'up' | 'down' | 'stable' = 'stable';

  ngOnChanges(changes: SimpleChanges) {
    this.calculateTrend();
  }

  private calculateTrend() {
    if (this.previousPeriodCompleted === 0) {
      this.trendDirection = 'stable';
      this.trendValue = 0;
      return;
    }

    const difference = this.completedActivities - this.previousPeriodCompleted;
    this.trendValue = Math.abs(Math.round((difference / this.previousPeriodCompleted) * 100));
    
    if (difference > 0) {
      this.trendDirection = 'up';
    } else if (difference < 0) {
      this.trendDirection = 'down';
    } else {
      this.trendDirection = 'stable';
    }
  }
}
