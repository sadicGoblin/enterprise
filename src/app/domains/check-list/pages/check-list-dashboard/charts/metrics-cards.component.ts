import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-metrics-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  animations: [
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ],
  template: `
    <div class="metrics-cards">
      <!-- Tarjeta de cumplimiento total -->
      <mat-card class="metric-card compliance-card" @scaleIn>
        <mat-card-content>
          <div class="metric-content">
            <div class="metric-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="metric-data">
              <h2>{{ complianceRate }}%</h2>
              <p>Cumplimiento</p>
              <div class="progress-container">
                <div class="progress-bar" 
                    [ngClass]="{
                      'success': complianceRate >= 75,
                      'warning': complianceRate >= 50 && complianceRate < 75,
                      'danger': complianceRate < 50
                    }" 
                    [style.width.%]="complianceRate">
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Tarjeta de usuarios activos -->
      <mat-card class="metric-card users-card" @scaleIn>
        <mat-card-content>
          <div class="metric-content">
            <div class="metric-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="metric-data">
              <h2>{{ totalUsers }}</h2>
              <p>Usuarios Activos</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Tarjeta de actividades pendientes -->
      <mat-card class="metric-card pending-card" @scaleIn>
        <mat-card-content>
          <div class="metric-content">
            <div class="metric-icon">
              <mat-icon>assignment_late</mat-icon>
            </div>
            <div class="metric-data">
              <h2>{{ pendingActivities }}</h2>
              <p>Actividades Pendientes</p>
              <div class="progress-container">
                <div class="progress-bar warning" 
                    [style.width.%]="pendingPercentage">
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Tarjeta de proyectos activos -->
      <mat-card class="metric-card projects-card" @scaleIn>
        <mat-card-content>
          <div class="metric-content">
            <div class="metric-icon">
              <mat-icon>domain</mat-icon>
            </div>
            <div class="metric-data">
              <h2>{{ totalProjects }}</h2>
              <p>Proyectos Activos</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .metrics-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    
    @media (max-width: 1200px) {
      .metrics-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 600px) {
      .metrics-cards {
        grid-template-columns: 1fr;
      }
    }
    
    .metric-card {
      background: linear-gradient(145deg, #1e2132, #2d3042);
      backdrop-filter: blur(10px);
      border: none;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1);
      border-radius: 5px;
      padding: 0;
      overflow: hidden;
      height: 100%;
      position: relative;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .metric-card:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }
    
    .compliance-card:before {
      background: linear-gradient(to right, #3B82F6, #60A5FA, #93C5FD);
    }
    
    .users-card:before {
      background: linear-gradient(to right, #8B5CF6, #A78BFA, #C4B5FD);
    }
    
    .pending-card:before {
      background: linear-gradient(to right, #F59E0B, #FBBF24, #FCD34D);
    }
    
    .projects-card:before {
      background: linear-gradient(to right, #10B981, #34D399, #6EE7B7);
    }
    
    .metric-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 20px rgba(0, 0, 0, 0.25), 0 8px 8px rgba(0, 0, 0, 0.15);
    }
    
    .metric-content {
      display: flex;
      align-items: center;
      padding: 16px;
      height: 100%;
    }
    
    .metric-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      margin-right: 16px;
      flex-shrink: 0;
    }
    
    .compliance-card .metric-icon {
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    }
    
    .users-card .metric-icon {
      background: linear-gradient(135deg, #8B5CF6, #6D28D9);
    }
    
    .pending-card .metric-icon {
      background: linear-gradient(135deg, #F59E0B, #D97706);
    }
    
    .projects-card .metric-icon {
      background: linear-gradient(135deg, #10B981, #047857);
    }
    
    .metric-icon mat-icon {
      color: white;
      font-size: 24px;
      height: 24px;
      width: 24px;
    }
    
    .metric-data {
      flex-grow: 1;
    }
    
    .metric-data h2 {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: #f0f0f0;
    }
    
    .metric-data p {
      font-size: 0.85rem;
      color: #a0a0a0;
      margin: 0 0 8px 0;
    }
    
    .progress-container {
      height: 6px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 8px;
    }
    
    .progress-bar {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    
    .progress-bar.success {
      background: linear-gradient(90deg, #10B981, #059669);
    }
    
    .progress-bar.warning {
      background: linear-gradient(90deg, #F59E0B, #D97706);
    }
    
    .progress-bar.danger {
      background: linear-gradient(90deg, #EF4444, #DC2626);
    }
  `]
})
export class MetricsCardsComponent {
  @Input() complianceRate: number = 0;
  @Input() totalUsers: number = 0;
  @Input() pendingActivities: number = 0;
  @Input() totalActivities: number = 0;
  @Input() totalProjects: number = 0;
  @Input() pendingPercentage: number = 0;
}
