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
        <mat-card-title>Actividades Asignadas vs. Completadas por Día</mat-card-title>
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
      width: 100%;
      height: 300px; /* Altura fija para el gráfico */
      max-height: 300px; /* Máxima altura para mantener consistencia */
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
  private assignedData: number[] = [];
  private completedData: number[] = [];
  
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
    
    // Asegurar que el contenedor del gráfico mantenga la altura fija
    if (this.chartCanvas && this.chartCanvas.nativeElement.parentElement) {
      this.chartCanvas.nativeElement.parentElement.style.height = '300px';
    }
    
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
    
    // Agrupar por día y contar actividades asignadas vs completadas
    const dailyStats: Record<string, { assigned: number, completed: number }> = {};
    
    // Procesar datos para obtener estadísticas diarias
    filteredData.forEach(item => {
      const day = parseInt(item.dia, 10);
      if (isNaN(day)) return;
      
      const dayKey = day.toString();
      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = { assigned: 0, completed: 0 };
      }
      
      // Incrementamos el contador de asignadas
      dailyStats[dayKey].assigned++;
      
      // Si está completada, incrementamos ese contador también
      if (item.diaCompletado === '1') {
        dailyStats[dayKey].completed++;
      }
    });
    
    // Generar etiquetas y datos de actividades
    // Primero obtenemos todos los días únicos
    const days = Object.keys(dailyStats)
      .map(day => parseInt(day, 10))
      .sort((a, b) => a - b); // Ordenar días numéricamente
    
    this.labels = days.map(day => `Día ${day}`);
    this.assignedData = days.map(day => dailyStats[day.toString()].assigned);
    this.completedData = days.map(day => dailyStats[day.toString()].completed);
  }

  private getChartData(): ChartConfiguration['data'] {
    // Obtener colores de la paleta para ambas series
    const colors = this.chartUtils.generateChartColors(2);
    const blueColor = colors[0]; // Azul para asignadas
    const greenColor = colors[1]; // Verde para completadas
    
    return {
      labels: this.labels,
      datasets: [
        {
          label: 'Actividades Asignadas',
          data: this.assignedData,
          borderColor: blueColor,
          backgroundColor: this.chartUtils.adjustAlpha(blueColor, 0.1),
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: blueColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          order: 1
        },
        {
          label: 'Actividades Completadas',
          data: this.completedData,
          borderColor: greenColor,
          backgroundColor: this.chartUtils.adjustAlpha(greenColor, 0.1),
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: greenColor,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          order: 2
        }
      ]
    };
  }

  private getChartOptions(): any {
    // Asegurar que el contenedor del gráfico tenga una altura fija
    if (this.chartCanvas && this.chartCanvas.nativeElement.parentElement) {
      this.chartCanvas.nativeElement.parentElement.style.height = '300px';
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grace: '10%',
          ticks: {
            precision: 0,
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
          grid: {
            display: false
          },
          ticks: {
            color: '#a0a0a0',
            font: {
              size: 11
            }
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
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
          display: false // El título ya está en el mat-card-header
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 10,
          cornerRadius: 4,
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
    };
  }
}
