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
  selector: 'app-bar-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    NgChartsModule
  ],
  template: `
    <mat-card class="chart-card">
      <mat-card-header>
        <mat-card-title>Cumplimiento por Proyecto</mat-card-title>
      </mat-card-header>
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
      background: linear-gradient(135deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.95));
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      border-radius: 5px;
      height: 100%;
      overflow: hidden;
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
    
    .bar-chart-wrapper {
      max-height: 300px;
      overflow-y: auto;
      padding-right: 10px;
    }
    
    .chart-container {
      position: relative;
      width: 100%;
      min-height: 200px;
      padding: 8px 0;
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
  @Input() rawData: CheckListRawItem[] = [];
  @Input() selectedProject: string = '';
  @Input() selectedUser: string = '';
  @Input() selectedScope: string = '';
  
  // Datos procesados internamente
  private projects: string[] = [];
  private completionRates: number[] = [];
  
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
    
    // Calcular tasas de cumplimiento por proyecto
    const projectStats: Record<string, { total: number, completed: number }> = {};
    
    // Inicializar estadísticas por proyecto
    filteredData.forEach(item => {
      if (!projectStats[item.Obra]) {
        projectStats[item.Obra] = { total: 0, completed: 0 };
      }
      
      projectStats[item.Obra].total++;
      if (item.diaCompletado === '1') {
        projectStats[item.Obra].completed++;
      }
    });
    
    // Calcular tasas de cumplimiento y ordenar por tasa
    const projectsData = Object.entries(projectStats)
      .map(([project, stats]) => ({
        project,
        rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      }))
      .sort((a, b) => b.rate - a.rate); // Ordenar de mayor a menor tasa
    
    // Extraer proyectos y tasas en arrays separados
    this.projects = projectsData.map(item => item.project);
    this.completionRates = projectsData.map(item => item.rate);
  }

  private getChartData(): ChartConfiguration['data'] {
    // Generar colores usando el servicio compartido
    const colors = this.chartUtils.generateChartColors(this.projects.length);
    
    return {
      labels: this.projects,
      datasets: [{
        label: 'Porcentaje de cumplimiento',
        data: this.completionRates,
        backgroundColor: colors.map(c => this.chartUtils.adjustAlpha(c, 0.8)),
        borderColor: colors,
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

  // Los métodos generateChartColors y adjustColorBrightness
  // se han movido al servicio ChartUtilsService
}
