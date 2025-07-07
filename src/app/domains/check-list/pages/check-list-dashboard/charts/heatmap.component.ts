import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  template: `
    <mat-card class="chart-card heatmap-card">
      <mat-card-content>
        <h3>Distribución por Periodicidad y Ámbito</h3>
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
      background: rgba(30, 30, 30, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      height: 100%;
    }
    
    .heatmap-card h3 {
      font-size: 16px;
      font-weight: normal;
      color: #e0e0e0;
      margin-top: 0;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .heatmap-container {
      width: 100%;
      overflow-x: auto;
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
export class HeatmapComponent {
  @Input() heatmapData: Record<string, Record<string, number>> = {};
  @Input() periodicities: string[] = [];
  @Input() scopes: string[] = [];
  
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
