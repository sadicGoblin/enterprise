import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="summary-card" [ngClass]="{'has-trend': showTrend}">
      <div class="card-icon" [ngStyle]="{'background-color': iconBgColor}">
        <mat-icon>{{icon}}</mat-icon>
      </div>
      <div class="card-content">
        <div class="card-title">{{title}}</div>
        <div class="card-value">{{value}}</div>
        <div class="card-trend" *ngIf="showTrend">
          <span [ngClass]="getTrendClass()">
            <mat-icon *ngIf="trendDirection !== 'stable'">
              {{trendDirection === 'up' ? 'arrow_upward' : 'arrow_downward'}}
            </mat-icon>
            {{trendValue}}%
          </span>
          <span class="trend-period">vs {{trendPeriod}}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .summary-card {
      display: flex;
      background: rgba(30, 30, 30, 0.5);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      height: 100px;
    }

    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 8px;
      margin-right: 16px;
    }

    .card-icon mat-icon {
      color: white;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .card-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .card-title {
      font-size: 14px;
      color: #a0a0a0;
      margin-bottom: 4px;
    }

    .card-value {
      font-size: 24px;
      font-weight: bold;
      color: #e0e0e0;
      margin-bottom: 8px;
    }

    .card-trend {
      font-size: 12px;
      display: flex;
      align-items: center;
    }

    .card-trend mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      margin-right: 2px;
    }

    .trend-up {
      color: #10B981;
      display: flex;
      align-items: center;
    }

    .trend-down {
      color: #EF4444;
      display: flex;
      align-items: center;
    }

    .trend-stable {
      color: #9CA3AF;
    }

    .trend-period {
      margin-left: 4px;
      color: #9CA3AF;
    }
  `]
})
export class SummaryCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = 'assessment';
  @Input() iconBgColor: string = '#3B82F6';
  @Input() showTrend: boolean = true;
  @Input() trendValue: number = 0;
  @Input() trendDirection: 'up' | 'down' | 'stable' = 'stable';
  @Input() trendPeriod: string = 'mes anterior';

  getTrendClass(): string {
    if (this.trendDirection === 'up') return 'trend-up';
    if (this.trendDirection === 'down') return 'trend-down';
    return 'trend-stable';
  }
}
