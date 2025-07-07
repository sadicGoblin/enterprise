import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-active-projects-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <mat-card class="project-card">
      <mat-card-content>
        <div class="card-content">
          <div class="card-icon active">
            <mat-icon>business</mat-icon>
          </div>
          <div class="card-data">
            <h3>{{ totalProjects }}</h3>
            <p>Proyectos activos</p>
            <div class="trend positive" *ngIf="showTrend">
              <mat-icon>arrow_upward</mat-icon>
              <span>{{ trendPercentage }}% vs. mes anterior</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .project-card {
      height: 100%;
      border-radius: 12px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .project-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }
    
    .card-content {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 16px;
    }
    
    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      margin-right: 16px;
      flex-shrink: 0;
    }
    
    .card-icon.active {
      background-color: rgba(3, 169, 244, 0.15);
    }
    
    .card-icon.active mat-icon {
      color: #03a9f4;
    }
    
    .card-data {
      flex-grow: 1;
    }
    
    .card-data h3 {
      font-size: 24px;
      margin: 0;
      font-weight: 500;
    }
    
    .card-data p {
      margin: 4px 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.9rem;
    }
    
    .trend {
      display: flex;
      align-items: center;
      font-size: 0.8rem;
      margin-top: 8px;
    }
    
    .trend mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
    
    .trend.positive {
      color: #4caf50;
    }
    
    .trend.negative {
      color: #f44336;
    }
    
    .trend.neutral {
      color: #9e9e9e;
    }
    `
  ]
})
export class ActiveProjectsCardComponent {
  @Input() totalProjects: number = 0;
  @Input() showTrend: boolean = false;
  @Input() trendPercentage: number = 0;
}
