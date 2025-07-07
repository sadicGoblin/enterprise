import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    NgChartsModule
  ],
  template: `
    <mat-card class="chart-card">
      <mat-card-content>
        <div class="chart-container">
          <canvas #chartCanvas></canvas>
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
    
    .chart-container {
      position: relative;
      height: 100%;
      width: 100%;
      min-height: 300px;
    }
  `]
})
export class DonutChartComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() completedActivities: number = 0;
  @Input() pendingActivities: number = 0;
  @Input() totalActivities: number = 0;
  @Input() chartData: {
    labels: string[],
    data: number[],
    backgroundColor: string[]
  } = { labels: [], data: [], backgroundColor: [] };
  
  private chart: Chart | null = null;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['chartData'] || changes['completedActivities'] || changes['pendingActivities'] || changes['totalActivities'])) {
      // Si se proporciona chartData, usarlo directamente
      if (this.chartData && this.chartData.data.length > 0) {
        this.updateChart();
      } else {
        // Si no hay chartData, usar las propiedades individuales
        this.updateChart();
      }
    }
  }

  private initChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: this.getChartData(),
      options: this.getChartOptions()
    });
  }

  private updateChart(): void {
    if (!this.chart) return;
    
    // Actualiza los datos del gráfico
    if (this.chartData && this.chartData.data.length > 0) {
      // Usar chartData si está disponible
      this.chart.data = {
        labels: this.chartData.labels,
        datasets: [{
          data: this.chartData.data,
          backgroundColor: this.chartData.backgroundColor,
          borderColor: this.chartData.backgroundColor.map(color => this.adjustBrightness(color, -10)),
          borderWidth: 1,
          hoverOffset: 5
        }]
      };
    } else {
      // Usar propiedades individuales como respaldo
      this.chart.data = this.getChartData();
    }
    
    this.chart.update();
  }

  private getChartData(): ChartConfiguration['data'] {
    return {
      labels: ['Completadas', 'Pendientes'],
      datasets: [{
        data: [this.completedActivities, this.pendingActivities],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // Verde para completadas
          'rgba(239, 68, 68, 0.8)'    // Rojo para pendientes
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
        hoverOffset: 5
      }]
    };
  }

  private adjustBrightness(hex: string, percent: number): string {
    // Convierte hex a rgb
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    // Ajusta el brillo
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    // Convierte rgb a hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  private getChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e0e0e0',
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Total Actividades: Asignadas vs Completadas',
          color: '#e0e0e0',
          font: {
            size: 16,
            weight: 'normal'
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const percentage = this.totalActivities > 0 ? Math.round((value / this.totalActivities) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }
}
