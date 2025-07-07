import { Component, Input, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { ChartUtilsService } from './chart-utils.service';

// Importar el modelo de DashboardActivity
interface DashboardActivity {
  id: string;
  obra: string;
  usuario: string;
  periodo: string;
  etapaConst: string;
  subProceso: string;
  ambito: string;
  actividad: string;
  periocidad: string;
  dia: string;
  diaCompletado: string;
  fecha: Date;
  diaSemana: string;
  estado: string;
}

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule
  ],
  template: `
    <div class="recent-activities">
      <mat-card class="chart-card recent-card">
        <mat-card-header>
          <mat-card-title>Actividades Recientes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource" class="modern-table">
              <!-- Columna Obra -->
              <ng-container matColumnDef="obra">
                <th mat-header-cell *matHeaderCellDef>Proyecto</th>
                <td mat-cell *matCellDef="let activity">{{ activity.obra }}</td>
              </ng-container>
              
              <!-- Columna Usuario -->
              <ng-container matColumnDef="usuario">
                <th mat-header-cell *matHeaderCellDef>Usuario</th>
                <td mat-cell *matCellDef="let activity">{{ activity.usuario }}</td>
              </ng-container>
              
              <!-- Columna Actividad -->
              <ng-container matColumnDef="actividad">
                <th mat-header-cell *matHeaderCellDef>Actividad</th>
                <td mat-cell *matCellDef="let activity">{{ activity.actividad }}</td>
              </ng-container>
              
              <!-- Columna Ámbito -->
              <ng-container matColumnDef="ambito">
                <th mat-header-cell *matHeaderCellDef>Ámbito</th>
                <td mat-cell *matCellDef="let activity">{{ activity.ambito }}</td>
              </ng-container>
              
              <!-- Columna Día -->
              <ng-container matColumnDef="dia">
                <th mat-header-cell *matHeaderCellDef>Día</th>
                <td mat-cell *matCellDef="let activity">{{ activity.dia }} ({{ activity.diaSemana }})</td>
              </ng-container>
              
              <!-- Columna Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let activity">
                  <span class="status-badge" 
                        [ngStyle]="getStatusBadgeStyles(activity.estado)">
                    {{ activity.estado }}
                  </span>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <!-- Paginador para la tabla -->
            <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .recent-activities {
      margin-top: 1rem;
      height: 100%;
    }

    .chart-card {
      background: linear-gradient(145deg, #1e2132, #2d3042);
      backdrop-filter: blur(10px);
      border: none;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1);
      border-radius: 5px;
      height: 100%;
      overflow: hidden;
      position: relative;
      transition: transform 0.3s, box-shadow 0.3s;
      
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
    
    .recent-card {
      height: 100%;
    }

    mat-card-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    
    mat-card-title {
      color: #ffffff !important; /* Forzar color blanco para el título */
      font-size: 0.95rem;
      font-weight: 500;
      margin: 0;
    }
    
    mat-card-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .table-container {
      flex: 1;
      overflow: auto;
      margin-top: 0.5rem;
    }

    .modern-table {
      width: 100%;
      background: transparent;
      border-collapse: separate;
      border-spacing: 0 4px;
    }

    /* Encabezados de la tabla */
    .modern-table th {
      color: #a0a0a0;
      font-size: 0.9rem;
      font-weight: 500;
      padding: 12px 8px;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Celdas de la tabla */
    .modern-table td {
      color: #e0e0e0;
      font-size: 0.9rem;
      padding: 8px;
    }
    
    /* Filas de la tabla */
    .modern-table tr.mat-row {
      background: rgba(255, 255, 255, 0.03);
      transition: all 0.2s;
    }
    
    .modern-table tr.mat-row:hover {
      background: rgba(255, 255, 255, 0.07);
      transform: translateY(-1px);
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      text-align: center;
      font-weight: 500;
      border-width: 1px;
      border-style: solid;
      transition: all 0.2s ease;
    }

    .status-badge:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Estilo para el paginador */
    mat-paginator {
      background: transparent;
      color: #a0a0a0;
      margin-top: 0.5rem;
    }
  `]
})
export class RecentActivitiesComponent implements OnChanges {
  @Input() activities: DashboardActivity[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  displayedColumns: string[] = ['obra', 'usuario', 'actividad', 'ambito', 'dia', 'estado'];
  dataSource = new MatTableDataSource<DashboardActivity>([]);
  
  // Variables para colores consistentes
  completedColor: string = '';
  pendingColor: string = '';
  
  constructor(private chartUtils: ChartUtilsService) {
    const statusColors = this.chartUtils.getStatusColors();
    this.completedColor = statusColors.completed;
    this.pendingColor = statusColors.pending;
  }
  
  /**
   * Obtiene los estilos para el badge de estado según el estado de la actividad
   */
  getStatusBadgeStyles(status: string): any {
    const isCompleted = status === 'Completado';
    const color = isCompleted ? this.completedColor : this.pendingColor;
    
    return {
      'background-color': this.chartUtils.adjustAlpha(color, 0.2),
      'color': color,
      'border-color': color
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activities']) {
      this.dataSource.data = this.activities;
      
      // Si el paginador ya está inicializado, asignar de nuevo
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    }
  }
}
