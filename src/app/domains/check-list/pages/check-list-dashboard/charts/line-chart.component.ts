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
  selector: 'app-line-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    NgChartsModule
  ],
  template: `
    <mat-card class="chart-card full-width-chart">
      <mat-card-header>
        <mat-card-title>Cumplimiento Diario</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="chart-container">
          <canvas #chartCanvas></canvas>
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

    .full-width-chart {
      width: 100%;
      margin-bottom: 16px;
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
    
    .chart-container {
      position: relative;
      height: 100%;
      width: 100%;
      min-height: 250px;
      padding: 16px 8px;
    }
  `]
})
export class LineChartComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() rawData: CheckListRawItem[] = [];
  @Input() selectedProject: string = '';
  @Input() selectedUser: string = '';
  @Input() selectedScope: string = '';
  
  // Datos procesados internamente
  private labels: string[] = [];
  private completionData: number[] = [];
  
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
    
    // Agrupar por día y calcular tasa de cumplimiento
    const dailyStats: Record<string, { total: number, completed: number }> = {};
    
    // Procesar datos para obtener estadísticas diarias
    filteredData.forEach(item => {
      const day = parseInt(item.dia, 10);
      if (isNaN(day)) return;
      
      const dayKey = day.toString();
      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = { total: 0, completed: 0 };
      }
      
      dailyStats[dayKey].total++;
      if (item.diaCompletado === '1') {
        dailyStats[dayKey].completed++;
      }
    });
    
    // Generar etiquetas y datos de cumplimiento
    // Primero obtenemos todos los días únicos
    const days = Object.keys(dailyStats)
      .map(day => parseInt(day, 10))
      .sort((a, b) => a - b); // Ordenar días numéricamente
    
    this.labels = days.map(day => `Día ${day}`);
    this.completionData = days.map(day => {
      const stats = dailyStats[day.toString()];
      return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    });
  }

  private getChartData(): ChartConfiguration['data'] {
    // Obtener el primer color de la paleta para el gráfico de línea
    const colors = this.chartUtils.generateChartColors(1);
    const lineColor = colors[0];
    
    return {
      labels: this.labels,
      datasets: [
        {
          data: this.completionData,
          label: 'Cumplimiento Diario',
          backgroundColor: this.chartUtils.adjustAlpha(lineColor, 0.2),
          borderColor: lineColor,
          pointBackgroundColor: lineColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#539cf0',
          fill: 'origin',
        }
      ]
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
