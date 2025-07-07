import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Interfaz para los datos raw
interface CheckListRawItem {
  IdControl: string;
  Obra: string;
  Usuario: string;
  Periodo: string;
  EtapaConst: string;
  SubProceso: string;
  Ambito: string;
  Actividad: string;
  Periocidad: string;
  dia: string;
  diaCompletado: string;
}

// Interfaz para los usuarios top
interface UserComplianceStats {
  username: string;
  completed: number;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-active-projects-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="top-users-card">
      <mat-card-header>
        <mat-card-title>Top 8 Usuarios</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="users-list-container">
          <ng-container *ngIf="topUsers.length > 0; else noData">
            <div class="user-item" *ngFor="let user of topUsers; let i = index">
              <div class="rank-badge" [ngClass]="{'top-three': i < 3}">{{ i + 1 }}</div>
              <div class="user-info">
                <div class="user-name">{{ user.username }}</div>
                <div class="progress-container">
                  <div class="progress-bar" [style.width.%]="user.percentage"></div>
                </div>
                <div class="stats">
                  <span class="completion-text">{{ user.percentage | number:'1.0-0' }}%</span>
                  <span class="activity-count" [matTooltip]="user.completed + ' de ' + user.total + ' actividades completadas'">
                    {{ user.completed }}/{{ user.total }}
                  </span>
                </div>
              </div>
            </div>
          </ng-container>
          <ng-template #noData>
            <div class="no-data">
              <mat-icon>info</mat-icon>
              <p>No hay datos de cumplimiento disponibles</p>
            </div>
          </ng-template>
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
    
    .top-users-card {
      height: 100%;
      background: linear-gradient(145deg, #1e2132, #2d3042);
      backdrop-filter: blur(10px);
      border-radius: 5px;
      border: none;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      position: relative;
      transition: transform 0.3s, box-shadow 0.3s;
      display: flex;
      flex-direction: column;
      
      &:before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(to right, #3B82F6, #60A5FA, #93C5FD);
      }
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 20px rgba(0, 0, 0, 0.25), 0 8px 8px rgba(0, 0, 0, 0.15);
      }
    }
    
    ::ng-deep .mat-mdc-card-header {
      padding: 16px 16px 8px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    ::ng-deep .mat-mdc-card-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 500;
      color: #ffffff !important;
    }
    
    ::ng-deep .mat-mdc-card-content {
      padding: 0;
      flex-grow: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .users-list-container {
      padding: 12px 16px;
      flex-grow: 1;
      overflow-y: auto;
      max-height: 350px;
      
      /* Estilo para la barra de desplazamiento */
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        
        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
    
    .user-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .rank-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 12px;
      flex-shrink: 0;
    }
    
    .rank-badge.top-three {
      background: linear-gradient(135deg, #3B82F6, #60A5FA);
    }
    
    .user-info {
      flex-grow: 1;
    }
    
    .user-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: #ffffff;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .progress-container {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      margin-bottom: 6px;
      overflow: hidden;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(to right, #3B82F6, #60A5FA);
      border-radius: 3px;
    }
    
    .stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }
    
    .completion-text {
      color: #ffffff;
      font-weight: 600;
    }
    
    .activity-count {
      color: rgba(255, 255, 255, 0.7);
      cursor: help;
    }
    
    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 20px;
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
    }
    
    .no-data mat-icon {
      font-size: 36px;
      height: 36px;
      width: 36px;
      margin-bottom: 8px;
    }
    `
  ]
})
export class ActiveProjectsCardComponent implements OnChanges {
  @Input() rawData: CheckListRawItem[] = [];
  @Input() selectedProject: string = '';
  @Input() selectedScope: string = '';
  
  public topUsers: UserComplianceStats[] = [];
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawData'] || changes['selectedProject'] || changes['selectedScope']) {
      this.processData();
    }
  }
  
  /**
   * Procesa los datos para calcular los usuarios con mayor porcentaje de cumplimiento
   */
  private processData(): void {
    // Filtrar datos según los filtros seleccionados
    let filteredData = [...this.rawData];
    
    if (this.selectedProject) {
      filteredData = filteredData.filter(item => item.Obra === this.selectedProject);
    }
    
    if (this.selectedScope) {
      filteredData = filteredData.filter(item => item.Ambito === this.selectedScope);
    }
    
    // Calcular estadísticas de cumplimiento por usuario
    const userStats: Record<string, { completed: number, total: number }> = {};
    
    // Contar actividades totales y completadas por usuario
    filteredData.forEach(item => {
      if (!userStats[item.Usuario]) {
        userStats[item.Usuario] = { completed: 0, total: 0 };
      }
      
      userStats[item.Usuario].total++;
      
      if (item.diaCompletado === '1') {
        userStats[item.Usuario].completed++;
      }
    });
    
    // Convertir a array y calcular porcentajes
    const usersArray: UserComplianceStats[] = Object.keys(userStats).map(username => {
      const stats = userStats[username];
      const percentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      
      return {
        username,
        completed: stats.completed,
        total: stats.total,
        percentage
      };
    });
    
    // Ordenar por porcentaje de cumplimiento (descendente)
    usersArray.sort((a, b) => b.percentage - a.percentage);
    
    // Tomar solo los 8 mejores
    this.topUsers = usersArray.slice(0, 8);
  }
}
