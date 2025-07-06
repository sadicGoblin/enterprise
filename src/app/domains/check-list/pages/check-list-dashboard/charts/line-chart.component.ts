import { Component, ElementRef, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-title" *ngIf="title">{{ title }}</div>
    <div class="chart-container">
      <canvas #lineChartCanvas></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .chart-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #e0e0e0;
    }

    .chart-container {
      position: relative;
      height: 250px;
      width: 100%;
    }
  `]
})
export class LineChartComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() title: string = 'Tendencia de actividades';
  
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;

  constructor() {}

  ngOnInit() {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateChart();
    }
  }

  private initChart() {
    if (!this.lineChartCanvas || !this.data) return;

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line' as ChartType,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: {
            tension: 0.3, // Líneas curvas suaves
            borderWidth: 2
          },
          point: {
            radius: 3,
            hitRadius: 10,
            hoverRadius: 5
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#e0e0e0'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              precision: 0,
              color: '#e0e0e0'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'start',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              font: {
                size: 11
              },
              color: '#e0e0e0'
            }
          },
          title: {
            display: false,
            text: this.title,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              bottom: 20
            },
            color: '#e0e0e0'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y;
                }
                return label;
              }
            }
          }
        }
      }
    });
  }

  private updateChart() {
    if (!this.chart || !this.data) return;
    
    this.chart.data = this.data;
    this.chart.update();
  }

  /**
   * Destruir el gráfico cuando se destruya el componente
   */
  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
