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
      <mat-card class="metric-card" @scaleIn>
        <mat-card-content>
          <div class="metric-header">
            <div class="metric-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h2>{{ complianceRate }}%</h2>
          </div>
          <p>Cumplimiento Total</p>
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
        </mat-card-content>
      </mat-card>
      
      <!-- Tarjeta de usuarios activos -->
      <mat-card class="metric-card" @scaleIn>
        <mat-card-content>
          <div class="metric-header">
            <div class="metric-icon">
              <mat-icon>people</mat-icon>
            </div>
            <h2>{{ totalUsers }}</h2>
          </div>
          <p>Usuarios Activos</p>
        </mat-card-content>
      </mat-card>
      
      <!-- Tarjeta de actividades pendientes -->
      <mat-card class="metric-card" @scaleIn>
        <mat-card-content>
          <div class="metric-header">
            <div class="metric-icon">
              <mat-icon>assignment_late</mat-icon>
            </div>
            <h2>{{ pendingActivities }}</h2>
          </div>
          <p>Actividades Pendientes</p>
          <div class="progress-container">
            <div class="progress-bar warning" 
                 [style.width.%]="pendingPercentage">
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Tarjeta de proyectos activos -->
      <mat-card class="metric-card" @scaleIn>
        <mat-card-content>
          <div class="metric-header">
            <div class="metric-icon">
              <mat-icon>domain</mat-icon>
            </div>
            <h2>{{ totalProjects }}</h2>
          </div>
          <p>Proyectos Activos</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .metrics-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .metric-card {
      background: rgba(30, 30, 30, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 0.5rem;
    }
    
    .metric-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .metric-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 1rem;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
    }
    
    .metric-icon mat-icon {
      color: white;
    }
    
    mat-card-content h2 {
      font-size: 1.8rem;
      font-weight: bold;
      margin: 0;
      color: #f0f0f0;
    }
    
    mat-card-content p {
      font-size: 0.9rem;
      color: #a0a0a0;
      margin-bottom: 0.75rem;
    }
    
    .progress-container {
      height: 6px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.5rem;
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
