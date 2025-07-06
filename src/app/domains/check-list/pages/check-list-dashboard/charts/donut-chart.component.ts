import { Component, ElementRef, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-title" *ngIf="title">{{ title }}</div>
    <div class="chart-container">
      <canvas #donutChartCanvas></canvas>
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
      text-align: center;
    }

    .chart-container {
      position: relative;
      height: 250px;
      width: 100%;
    }
  `]
})
export class DonutChartComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() title: string = 'Cumplimiento';
  
  @ViewChild('donutChartCanvas') donutChartCanvas!: ElementRef<HTMLCanvasElement>;
  
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
    if (!this.donutChartCanvas || !this.data) return;

    const ctx = this.donutChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut' as ChartType,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              padding: 15,
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
              size: 16,
              weight: 'bold'
            },
            padding: {
              bottom: 10
            },
            color: '#e0e0e0'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${percentage}%`;
              }
            }
          }
        },
        layout: {
          padding: {
            top: 5,
            right: 10,
            bottom: 10,
            left: 10
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
