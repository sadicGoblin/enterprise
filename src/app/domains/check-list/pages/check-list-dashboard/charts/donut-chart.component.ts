import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';
import { ChartUtilsService } from './chart-utils.service';

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
  selector: 'app-donut-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    NgChartsModule
  ],
  template: `
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title>Total Actividades: Asignadas vs Completadas</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="chart-container">
          <div class="center-stats" *ngIf="totalActivities > 0">
            <div class="total-value">{{ totalActivities }}</div>
            <div class="total-label">Total</div>
            <div class="stat-row">
              <div class="stat completed">
                <span class="value">{{ completedActivities }}</span>
                <span class="label">Completadas</span>
                <span class="percent">{{ getPercentage(completedActivities) }}%</span>
              </div>
              <div class="stat pending">
                <span class="value">{{ pendingActivities }}</span>
                <span class="label">Pendientes</span>
                <span class="percent">{{ getPercentage(pendingActivities) }}%</span>
              </div>
            </div>
          </div>
          <canvas #chartCanvas></canvas>
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
    
    .chart-container {
      position: relative;
      height: 100%;
      width: 100%;
      min-height: 250px;
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .center-stats {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .total-value {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      line-height: 1;
      margin-bottom: 0;
    }

    .total-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 8px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 12px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      min-width: 90px;
      
      &.completed {
        background-color: rgba(16, 185, 129, 0.2); /* Verde semi-transparente */
      }
      
      &.pending {
        background-color: rgba(244, 63, 94, 0.2); /* Rojo semi-transparente */
      }

      .value {
        font-size: 16px;
        font-weight: bold;
        color: #ffffff;
        line-height: 1;
      }

      .label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        margin: 2px 0;
      }

      .percent {
        font-size: 14px;
        font-weight: bold;
        line-height: 1;
      }

      &.completed .percent {
        color: #10B981; /* Verde */
      }

      &.pending .percent {
        color: #F43F5E; /* Rojo */
      }
    }
  `]
})
export class DonutChartComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() completedActivities: number = 0;
  @Input() pendingActivities: number = 0;
  @Input() totalActivities: number = 0;
  @Input() rawData: CheckListRawItem[] = [];
  @Input() selectedProject: string = '';
  @Input() selectedUser: string = '';
  @Input() selectedScope: string = '';
  
  // Datos procesados internamente
  private labels: string[] = [];
  private data: number[] = [];
  private backgroundColor: string[] = [];
  
  private chart: Chart | null = null;

  constructor(private chartUtils: ChartUtilsService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawData'] || changes['selectedProject'] || changes['selectedUser'] || changes['selectedScope']) {
      this.processData();
      if (this.chart) {
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
    
    // Contar total de actividades y completadas
    let total = filteredData.length;
    let completed = filteredData.filter(item => item.diaCompletado === '1').length;
    
    // Actualizar las propiedades para el gráfico
    this.totalActivities = total;
    this.completedActivities = completed;
    this.pendingActivities = total - completed;
  }

  private updateChart(): void {
    if (!this.chart) return;
    
    // Actualizar datos del gráfico
    this.chart.data = this.getChartData();
    this.chart.update();
  }
  
  // Calcular el porcentaje de un valor con respecto al total
  getPercentage(value: number): number {
    if (this.totalActivities <= 0) return 0;
    return Math.round((value / this.totalActivities) * 100);
  }

  private getChartData(): ChartConfiguration['data'] {
    // Obtener la paleta de colores básicos
    const chartColors = this.chartUtils.generateChartColors(2);
    
    return {
      labels: ['Asignadas', 'Completadas'],
      datasets: [{
        data: [this.totalActivities, this.completedActivities],
        backgroundColor: [
          this.chartUtils.adjustAlpha(chartColors[0], 0.8), // Azul para asignadas
          this.chartUtils.adjustAlpha(chartColors[1], 0.8)  // Verde para completadas
        ],
        borderColor: [
          chartColors[0], // Azul para asignadas
          chartColors[1]  // Verde para completadas
        ],
        borderWidth: 1,
        hoverBackgroundColor: [
          this.chartUtils.adjustAlpha(chartColors[0], 0.9),
          this.chartUtils.adjustAlpha(chartColors[1], 0.9)
        ],
        hoverOffset: 5
      }]
    };
  }

  // Genera una paleta de colores para los gráficos
  private generateChartColors(count: number): string[] {
    const baseColors = [
      '#4285F4', // Google Blue
      '#EA4335', // Google Red
      '#FBBC05', // Google Yellow
      '#34A853', // Google Green
      '#8E24AA', // Purple
      '#0097A7', // Teal
      '#FF9800', // Orange
      '#795548', // Brown
      '#607D8B', // Blue Grey
      '#1E88E5', // Light Blue
    ];
    
    const colors: string[] = [];
    
    for (let i = 0; i < count; i++) {
      if (i < baseColors.length) {
        colors.push(baseColors[i]);
      } else {
        // Si necesitamos más colores de los que tenemos en la paleta base,
        // generamos variaciones ajustando el brillo
        const baseIndex = i % baseColors.length;
        const brightnessAdjust = Math.floor(i / baseColors.length) * 10;
        colors.push(this.adjustBrightness(baseColors[baseIndex], brightnessAdjust));
      }
    }
    
    return colors;
  }
  
  // Ajusta el brillo de un color
  private adjustBrightness(color: string, percent: number): string {
    // Si es un color en formato rgba
    if (color.startsWith('rgba')) {
      return color;
    }
    
    // Para colores hexadecimales
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const adjR = Math.floor(r * (100 + percent) / 100);
    const adjG = Math.floor(g * (100 + percent) / 100);
    const adjB = Math.floor(b * (100 + percent) / 100);

    const rStr = ((adjR < 255) ? adjR : 255).toString(16).padStart(2, '0');
    const gStr = ((adjG < 255) ? adjG : 255).toString(16).padStart(2, '0');
    const bStr = ((adjB < 255) ? adjB : 255).toString(16).padStart(2, '0');

    return `#${rStr}${gStr}${bStr}`;
  }

  private getChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%', // Reducimos ligeramente el recorte para que el donut sea más visible
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              size: 11
            },
            color: '#e0e0e0'
          }
        },
        title: {
          display: false // Quitamos el título duplicado ya que está en el mat-card-header
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 12,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        },
        datalabels: {
          display: true, // Activamos las etiquetas de datos
          color: '#ffffff',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value: number, context: any) => {
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${percentage}%`;
          },
          textAlign: 'center',
          align: 'end',
          anchor: 'end',
          offset: 5
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    };
  }
}
