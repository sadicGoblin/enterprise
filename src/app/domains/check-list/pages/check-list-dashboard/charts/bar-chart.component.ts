import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    NgChartsModule
  ],
  template: `
    <mat-card class="chart-card">
      <mat-card-content>
        <div class="bar-chart-wrapper">
          <div class="chart-container">
            <canvas #chartCanvas></canvas>
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
    
    .bar-chart-wrapper {
      max-height: 300px;
      overflow-y: auto;
      padding-right: 10px;
    }
    
    .chart-container {
      position: relative;
      width: 100%;
      min-height: 200px;
    }

    /* Estilo para la barra de desplazamiento */
    .bar-chart-wrapper::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .bar-chart-wrapper::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }

    .bar-chart-wrapper::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    .bar-chart-wrapper::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class BarChartComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() chartData: { projects: string[], completionRates: number[] } = { projects: [], completionRates: [] };
  @Input() projects: string[] = [];
  @Input() completionRates: number[] = [];
  
  private chart: Chart | null = null;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['chartData'] || changes['projects'] || changes['completionRates'])) {
      // Si se proporcionan projects y completionRates como inputs separados, actualizar chartData
      if (this.projects.length > 0 && this.completionRates.length > 0) {
        this.chartData = {
          projects: this.projects,
          completionRates: this.completionRates
        };
      }
      this.updateChart();
    }
  }

  private initChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.getChartData(),
      options: this.getChartOptions()
    });
  }

  private updateChart(): void {
    if (!this.chart) return;

    const data = this.getChartData();
    this.chart.data = data;
    this.chart.options = this.getChartOptions();
    this.chart.update();
  }

  private getChartData(): ChartConfiguration['data'] {
    // Generar gradiente de colores desde azul claro a azul oscuro
    const colors = this.generateChartColors(this.chartData.projects.length);
    
    return {
      labels: this.chartData.projects,
      datasets: [{
        label: 'Porcentaje de cumplimiento',
        data: this.chartData.completionRates,
        backgroundColor: colors,
        borderColor: colors.map(c => this.adjustColorBrightness(c, 20)),
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 40
      }]
    };
  }

  private getChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Para barras horizontales
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Cumplimiento por Proyecto',
          color: '#e0e0e0',
          font: {
            size: 16,
            weight: 'normal'
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `Cumplimiento: ${context.raw}%`;
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: '#a0a0a0',
            font: {
              size: 11
            }
          },
          grid: {
            display: false
          }
        },
        x: {
          min: 0,
          max: 100,
          ticks: {
            callback: function(value: any) {
              return value + '%';
            },
            color: '#a0a0a0',
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        }
      }
    };
  }

  // Genera una paleta de colores para los gráficos
  private generateChartColors(count: number): string[] {
    const baseColor = '#3B82F6'; // Azul primario
    const colors: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Variar el brillo basado en la posición
      const brightness = 100 - (i * (50 / Math.max(count - 1, 1)));
      colors.push(this.adjustColorBrightness(baseColor, brightness));
    }
    
    return colors;
  }
  
  // Ajusta el brillo de un color hexadecimal
  private adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.round(((num >> 16) & 255) * (percent / 100));
    const g = Math.round(((num >> 8) & 255) * (percent / 100));
    const b = Math.round((num & 255) * (percent / 100));
    return `rgba(${r}, ${g}, ${b}, 0.8)`;
  }
}
