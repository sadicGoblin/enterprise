import { Component, ElementRef, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-title" *ngIf="title">{{ title }}</div>
    <div class="bar-chart-wrapper">
      <div class="chart-container">
        <canvas #barChartCanvas></canvas>
      </div>
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

    .bar-chart-wrapper {
      position: relative;
      width: 100%;
      max-height: 350px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #666 #222;
    }

    .bar-chart-wrapper::-webkit-scrollbar {
      width: 6px;
    }

    .bar-chart-wrapper::-webkit-scrollbar-track {
      background: #222;
    }

    .bar-chart-wrapper::-webkit-scrollbar-thumb {
      background-color: #666;
      border-radius: 3px;
    }

    .chart-container {
      position: relative;
      min-height: 350px;
    }
  `]
})
export class BarChartComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() title: string = 'Actividades por proyecto';
  
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  
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
    if (!this.barChartCanvas || !this.data) return;

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Configurar altura adecuada para mostrar todos los proyectos
    const projectCount = this.data?.labels?.length || 0;
    const canvasHeight = Math.max(projectCount * 30, 300); // 30px por proyecto, mínimo 300px
    
    // Configurar el canvas con una altura que permita ver todos los proyectos
    this.barChartCanvas.nativeElement.height = canvasHeight;

    this.chart = new Chart(ctx, {
      type: 'bar' as ChartType,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',  // Barras horizontales
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 10,
            left: 10
          }
        },
        scales: {
          y: {
            ticks: {
              font: {
                size: 10 // Fuente más pequeña para las etiquetas
              },
              color: '#e0e0e0'
            },
            grid: {
              display: false
            }
          },
          x: {
            beginAtZero: true,
            grace: '5%',
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
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              font: {
                size: 11
              },
              color: '#e0e0e0'
            }
          },
          title: {
            display: false,  // El título lo manejamos en el template
            text: this.title,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              bottom: 15
            },
            color: '#e0e0e0'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.x !== null) {
                  label += context.parsed.x;
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
    
    // Actualizar los datos
    this.chart.data = this.data;
    
    // Ajustar la altura según la cantidad de proyectos
    if (this.barChartCanvas) {
      const projectCount = this.data?.labels?.length || 0;
      const canvasHeight = Math.max(projectCount * 30, 300);
      this.barChartCanvas.nativeElement.height = canvasHeight;
    }
    
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
