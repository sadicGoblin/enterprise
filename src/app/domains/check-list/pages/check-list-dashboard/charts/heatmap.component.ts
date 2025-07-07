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
      background: linear-gradient(135deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.95));
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      border-radius: 5px;
      height: 100%;
      overflow: hidden;
    }
    
    .mat-card-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    
    .mat-card-title {
      color: #e0e0e0;
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
    }
    
    .heatmap-container {
      width: 100%;
      overflow-x: auto;
      padding: 8px 0;
    }
    
    .heatmap-table {
      width: 100%;
      min-width: 500px;
    }
    
    .heatmap-table table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 2px;
    }
    
    .heatmap-table th {
      text-align: center;
      padding: 8px;
      font-size: 12px;
      color: #a0a0a0;
      font-weight: normal;
      vertical-align: bottom;
    }
    
    .heatmap-table td {
      text-align: center;
      padding: 10px 5px;
      font-size: 12px;
      color: #ffffff;
      border-radius: 4px;
      transition: all 0.2s ease-in-out;
    }
    
    .heatmap-table td:hover {
      transform: scale(1.05);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
    }
    
    .periodicity-label {
      font-weight: normal;
      color: #a0a0a0 !important;
      background-color: transparent !important;
      text-align: right !important;
      padding-right: 10px !important;
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
      return 'rgba(30, 30, 30, 0.4)';
    }
    
    // Escala de calor desde azul (frío/bajo) a rojo (caliente/alto)
    // El valor máximo hipotético es 20 (ajusta según tus datos reales)
    const maxValue = 20;
    const normalizedValue = Math.min(value / maxValue, 1); // Valor entre 0 y 1
    
    let r, g, b;
    
    if (normalizedValue < 0.5) {
      // De azul a verde (frío a templado)
      const t = normalizedValue * 2;
      r = Math.round(41 * (1 - t) + 56 * t);
      g = Math.round(114 * (1 - t) + 192 * t);
      b = Math.round(203 * (1 - t) + 122 * t);
    } else {
      // De verde a rojo (templado a caliente)
      const t = (normalizedValue - 0.5) * 2;
      r = Math.round(56 * (1 - t) + 220 * t);
      g = Math.round(192 * (1 - t) + 52 * t);
      b = Math.round(122 * (1 - t) + 47 * t);
    }
    
    return `rgba(${r}, ${g}, ${b}, 0.85)`;
  }
}
