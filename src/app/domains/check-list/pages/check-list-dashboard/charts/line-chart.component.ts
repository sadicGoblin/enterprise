import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-line-chart',
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
      min-height: 250px;
    }
  `]
})
export class LineChartComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() chartData: { labels: string[], completionData: number[] } = { labels: [], completionData: [] };
  @Input() labels: string[] = [];
  @Input() completionData: number[] = [];
  
  private chart: Chart | null = null;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['chartData'] || changes['labels'] || changes['completionData'])) {
      // Si se proporcionan labels y completionData como inputs separados, actualizar chartData
      if (this.labels.length > 0 && this.completionData.length > 0) {
        this.chartData = {
          labels: this.labels,
          completionData: this.completionData
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
      type: 'line',
      data: this.getChartData(),
      options: this.getChartOptions()
    });
  }

  private updateChart(): void {
    if (!this.chart) return;

    const data = this.getChartData();
    this.chart.data = data;
    this.chart.update();
  }

  private getChartData(): ChartConfiguration['data'] {
    return {
      labels: this.chartData.labels,
      datasets: [{
        label: 'Porcentaje de cumplimiento',
        data: this.chartData.completionData,
        fill: {
          target: 'origin',
          above: 'rgba(59, 130, 246, 0.1)'
        },
        borderColor: '#3B82F6',
        borderWidth: 3,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#3B82F6',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3B82F6',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4
      }]
    };
  }

  private getChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Tendencia de Cumplimiento Diario',
          color: '#e0e0e0',
          font: {
            size: 16,
            weight: 'normal'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context: any) => {
              return `Cumplimiento: ${context.raw}%`;
            }
          }
        }
      },
      scales: {
        y: {
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
        },
        x: {
          ticks: {
            color: '#a0a0a0',
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    };
  }
}
