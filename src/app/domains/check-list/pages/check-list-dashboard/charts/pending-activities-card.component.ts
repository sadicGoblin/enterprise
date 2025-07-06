import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SummaryCardComponent } from './summary-card.component';

@Component({
  selector: 'app-pending-activities-card',
  standalone: true,
  imports: [SummaryCardComponent],
  template: `
    <app-summary-card
      title="Actividades Pendientes"
      [value]="pendingActivities"
      icon="pending_actions"
      iconBgColor="#F59E0B"
      [showTrend]="true"
      [trendValue]="trendValue"
      [trendDirection]="trendDirection"
      [trendPeriod]="trendPeriod">
    </app-summary-card>
  `
})
export class PendingActivitiesCardComponent implements OnChanges {
  @Input() pendingActivities: number = 0;
  @Input() previousPeriodPending: number = 0;
  @Input() trendPeriod: string = 'mes anterior';

  trendValue: number = 0;
  trendDirection: 'up' | 'down' | 'stable' = 'stable';

  ngOnChanges(changes: SimpleChanges) {
    this.calculateTrend();
  }

  private calculateTrend() {
    if (this.previousPeriodPending === 0) {
      this.trendDirection = 'stable';
      this.trendValue = 0;
      return;
    }

    const difference = this.pendingActivities - this.previousPeriodPending;
    this.trendValue = Math.abs(Math.round((difference / this.previousPeriodPending) * 100));
    
    // Para pendientes, un aumento es negativo y una disminución es positiva
    if (difference > 0) {
      this.trendDirection = 'up';
    } else if (difference < 0) {
      this.trendDirection = 'down';
    } else {
      this.trendDirection = 'stable';
    }
  }
}
