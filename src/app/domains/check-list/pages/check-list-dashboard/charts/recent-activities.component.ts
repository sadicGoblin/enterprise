import { Component, Input, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';

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
      <mat-card>
        <mat-card-header>
          <mat-card-title>Actividades Recientes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="dataSource">
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
                  <span class="status-badge" [ngClass]="{
                    'status-completed': activity.estado === 'Completado',
                    'status-pending': activity.estado === 'Pendiente'
                  }">
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
      margin-top: 1.5rem;
    }

    mat-card {
      background: rgba(30, 30, 30, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    }

    mat-card-header {
      padding: 1rem 1rem 0 1rem;
    }

    mat-card-title {
      color: #e0e0e0;
      font-size: 1.2rem;
      font-weight: normal;
    }

    .table-container {
      overflow-x: auto;
      margin-top: 1rem;
    }

    table {
      width: 100%;
      background: transparent;
    }

    th {
      color: #a0a0a0;
      font-size: 0.9rem;
      font-weight: normal;
    }

    td {
      color: #e0e0e0;
      font-size: 0.9rem;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      text-align: center;
    }

    .status-completed {
      background-color: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    .status-pending {
      background-color: rgba(239, 68, 68, 0.2);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
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
