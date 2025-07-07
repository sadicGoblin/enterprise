import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

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

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  template: `
    <mat-card class="chart-card heatmap-card">
      <mat-card-header>
        <mat-card-title>Distribución por Periodicidad y Ámbito</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="heatmap-container">
          <div class="heatmap-table">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th *ngFor="let scope of scopes">{{ scope }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let periodicity of periodicities">
                  <td class="periodicity-label">{{ periodicity }}</td>
                  <td *ngFor="let scope of scopes" 
                      [style.background-color]="getHeatmapColor(heatmapData[periodicity] && heatmapData[periodicity][scope] || 0)">
                    {{ heatmapData[periodicity] && heatmapData[periodicity][scope] || 0 }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
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
    
    .mat-card-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    
    .mat-card-title {
      color: #ffffff !important; /* Forzar color blanco para el título */
      font-size: 0.95rem;
      font-weight: 500;
      margin: 0;
    }
    
    ::ng-deep .mat-mdc-card-title {
      color: #ffffff !important; /* Forzar color blanco para el título */
    }
    
    .heatmap-container {
      width: 100%;
      height: 100%;
      overflow-x: auto;
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .heatmap-table {
      width: 100%;
      min-width: 500px;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      padding: 12px;
      box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    
    .heatmap-table table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 4px;
      table-layout: fixed;
    }
    
    .heatmap-table th {
      text-align: center;
      padding: 10px 8px;
      font-size: 0.75rem;
      color: #d0d0d0;
      font-weight: 500;
      vertical-align: bottom;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .heatmap-table td {
      text-align: center;
      padding: 12px 8px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #ffffff;
      border-radius: 6px;
      transition: all 0.2s ease-in-out;
      min-width: 60px;
      position: relative;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .heatmap-table td:hover {
      transform: scale(1.08);
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
      z-index: 10;
      cursor: pointer;
    }
    
    .periodicity-label {
      font-weight: 500;
      font-size: 0.8rem;
      color: #d0d0d0 !important;
      background-color: rgba(60, 65, 80, 0.3) !important;
      text-align: right !important;
      padding: 8px 12px !important;
      border-radius: 4px 0 0 4px !important;
      box-shadow: none !important;
      width: 100px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class HeatmapComponent implements OnChanges {
  @Input() rawData: CheckListRawItem[] = [];
  @Input() selectedProject: string = '';
  @Input() selectedUser: string = '';
  @Input() selectedScope: string = '';
  
  // Datos procesados internamente
  public heatmapData: Record<string, Record<string, number>> = {};
  public periodicities: string[] = [];
  public scopes: string[] = [];
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawData'] || changes['selectedProject'] || changes['selectedUser'] || changes['selectedScope']) {
      this.processData();
    }
  }

  private processData(): void {
    // Filtrar datos según los filtros seleccionados
    let filteredData = [...this.rawData];
    
    if (this.selectedProject) {
      filteredData = filteredData.filter(item => item.Obra === this.selectedProject);
    }
    
    if (this.selectedUser) {
      filteredData = filteredData.filter(item => item.Usuario === this.selectedUser);
    }
    
    if (this.selectedScope) {
      filteredData = filteredData.filter(item => item.Ambito === this.selectedScope);
    }
    
    // Extraer ámbitos únicos
    this.scopes = Array.from(new Set(filteredData.map(item => item.Ambito)));
    
    // Extraer periodicidades únicas
    this.periodicities = Array.from(new Set(filteredData.map(item => item.Periocidad)));
    
    // Inicializar la estructura del heatmap
    this.heatmapData = {};
    this.periodicities.forEach(periodicity => {
      this.heatmapData[periodicity] = {};
      this.scopes.forEach(scope => {
        this.heatmapData[periodicity][scope] = 0;
      });
    });
    
    // Rellenar el heatmap con los conteos
    filteredData.forEach(item => {
      if (this.heatmapData[item.Periocidad] && this.heatmapData[item.Periocidad][item.Ambito] !== undefined) {
        this.heatmapData[item.Periocidad][item.Ambito]++;
      }
    });
  }

  getHeatmapColor(value: number): string {
    // Si no hay valor, devolver un color neutral
    if (value === 0) {
      return 'rgba(40, 42, 54, 0.5)';
    }
    
    // Encontrar el valor máximo real en los datos para una escala dinámica
    let maxValue = 0;
    Object.keys(this.heatmapData).forEach(periodicity => {
      Object.keys(this.heatmapData[periodicity]).forEach(scope => {
        maxValue = Math.max(maxValue, this.heatmapData[periodicity][scope]);
      });
    });
    
    // Usar el máximo real o un valor mínimo de 10
    maxValue = Math.max(maxValue, 10);
    const normalizedValue = Math.min(value / maxValue, 1); // Valor entre 0 y 1
    
    let r, g, b;
    
    // Paleta de colores moderna
    if (normalizedValue < 0.3) {
      // Azul a cyan (valores bajos)
      const t = normalizedValue / 0.3;
      r = Math.round(59 * (1 - t) + 66 * t);
      g = Math.round(130 * (1 - t) + 190 * t);
      b = Math.round(246 * (1 - t) + 220 * t);
    } else if (normalizedValue < 0.6) {
      // Cyan a verde (valores medios bajos)
      const t = (normalizedValue - 0.3) / 0.3;
      r = Math.round(66 * (1 - t) + 76 * t);
      g = Math.round(190 * (1 - t) + 217 * t);
      b = Math.round(220 * (1 - t) + 112 * t);
    } else if (normalizedValue < 0.8) {
      // Verde a amarillo (valores medios altos)
      const t = (normalizedValue - 0.6) / 0.2;
      r = Math.round(76 * (1 - t) + 253 * t);
      g = Math.round(217 * (1 - t) + 204 * t);
      b = Math.round(112 * (1 - t) + 71 * t);
    } else {
      // Amarillo a rojo (valores altos)
      const t = (normalizedValue - 0.8) / 0.2;
      r = Math.round(253 * (1 - t) + 235 * t);
      g = Math.round(204 * (1 - t) + 87 * t);
      b = Math.round(71 * (1 - t) + 87 * t);
    }
    
    // Agregar una sombra interna con box-shadow
    return `rgba(${r}, ${g}, ${b}, 0.9)`;
  }
}
