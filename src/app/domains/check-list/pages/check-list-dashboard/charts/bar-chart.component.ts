import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
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
        <mat-card-title>Actividades por Proyecto</mat-card-title>
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
    
    .bar-chart-wrapper {
      height: calc(100% - 60px); /* Restar la altura aproximada del header */
      overflow-y: auto;
      padding-right: 10px;
      display: flex;
      flex-direction: column;
    }
    
    .chart-container {
      position: relative;
      width: 100%;
      flex-grow: 1;
      height: 430px; /* Altura fija para el gráfico */
      min-height: 430px; /* Altura mínima para asegurar visibilidad */
      max-height: 430px; /* Máxima altura para evitar que se descontrole */
      padding: 8px 0;
      display: block; /* Forzar que sea un bloque */
    }

    /* Estilo para la barra de desplazamiento */
    .bar-chart-wrapper::-webkit-scrollbar {
      width: 6px;
      height: 6px;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .bar-chart-wrapper::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
    }

    .bar-chart-wrapper::-webkit-scrollbar-thumb {
      border-radius: 5px;
      background-color: rgba(255, 255, 255, 0.2);
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.4);
      }
    }

    /* Estilizado completo */
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
  private assignedActivities: number[] = [];
  private completedActivities: number[] = [];
  
  private chart: Chart | null = null;

  constructor(private chartUtils: ChartUtilsService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.processData();
  }

  ngAfterViewInit(): void {
    // Dar tiempo al DOM para renderizarse completamente
    setTimeout(() => {
      if (this.rawData.length > 0) {
        this.initChart();
      }
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['rawData'] || 
      changes['selectedProject'] || 
      changes['selectedUser'] || 
      changes['selectedScope']
    ) {
      // Dar tiempo para que los cambios se propaguen
      setTimeout(() => {
        this.processData();
        if (this.chart) {
          this.updateChart();
        } else {
          this.initChart();
        }
      }, 100);
    }
  }

  private initChart(): void {
    if (!this.chartCanvas || !this.chartCanvas.nativeElement) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Procesar datos primero
    this.processData();
    
    // Asegurarnos que el contenedor tiene la altura correcta antes de inicializar el gráfico
    const containerHeight = 430; // Altura fija de 430px
    
    const container = this.chartCanvas.nativeElement.parentElement;
    if (container) {
      container.style.height = `${containerHeight}px`;
    }
    
    // Esperar un momento para que el DOM se actualice
    setTimeout(() => {
      // Destruir gráfico existente si hay uno
      if (this.chart) {
        this.chart.destroy();
      }
      
      // Crear nuevo gráfico
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: this.getChartData(),
        options: this.getChartOptions()
      });
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
    }, 50);
  }

  private updateChart(): void {
    if (!this.chart) {
      this.initChart(); // Si no existe el gráfico, lo inicializamos
      return;
    }

    // Asegurarnos que el contenedor tiene la altura correcta
    const containerHeight = 430; // Altura fija de 430px
    
    const container = this.chartCanvas.nativeElement.parentElement;
    if (container) {
      container.style.height = `${containerHeight}px`;
    }
    
    // Actualizar los datos
    const data = this.getChartData();
    this.chart.data = data;
    this.chart.options = this.getChartOptions();
    
    // Esperar un momento para que el DOM se actualice
    setTimeout(() => {
      this.chart?.update('none'); // 'none' para evitar animaciones en la actualización
      this.cdr.detectChanges();
    }, 50);
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
    
    // Contabilizar actividades asignadas y completadas por proyecto
    const projectStats: Record<string, { assigned: number, completed: number }> = {};
    
    // Inicializar estadísticas por proyecto
    filteredData.forEach(item => {
      if (!projectStats[item.Obra]) {
        projectStats[item.Obra] = { assigned: 0, completed: 0 };
      }
      
      // Incrementar contador de asignadas
      projectStats[item.Obra].assigned++;
      
      // Si está completada, incrementar ese contador
      if (item.diaCompletado === '1') {
        projectStats[item.Obra].completed++;
      }
    });
    
    // Ordenar proyectos por número de actividades asignadas
    const projectsData = Object.entries(projectStats)
      .map(([project, stats]) => ({
        project,
        assigned: stats.assigned,
        completed: stats.completed
      }))
      .sort((a, b) => b.assigned - a.assigned); // Ordenar por cantidad de actividades
    
    // Extraer datos en arrays separados
    this.projects = projectsData.map(item => item.project);
    this.assignedActivities = projectsData.map(item => item.assigned);
    this.completedActivities = projectsData.map(item => item.completed);
  }

  private getChartData(): ChartConfiguration['data'] {
    // Obtener solo los dos primeros colores de la paleta (azul y verde)
    const colors = this.chartUtils.generateChartColors(2);
    const blueColor = colors[0]; // Azul para asignadas
    const greenColor = colors[1]; // Verde para completadas
    
    return {
      labels: this.projects,
      datasets: [
        {
          label: 'Actividades Asignadas',
          data: this.assignedActivities,
          backgroundColor: this.chartUtils.adjustAlpha(blueColor, 0.7),
          borderColor: blueColor,
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 30,
          order: 2
        },
        {
          label: 'Actividades Completadas',
          data: this.completedActivities,
          backgroundColor: this.chartUtils.adjustAlpha(greenColor, 0.7),
          borderColor: greenColor,
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 30,
          order: 1
        }
      ]
    };
  }

  private getChartOptions(): any {
    const projectCount = this.projects.length;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y', // Para barras horizontales
      layout: {
        padding: {
          top: 15,
          bottom: 15,
          left: 5,
          right: 5
        },
        autoPadding: true
      },
      plugins: {
        legend: {
          display: true,
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
          display: false // El título ya está en el mat-card-header
        },
        tooltip: {
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 10,
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
          beginAtZero: true,
          grace: '5%',
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
        }
      },
      // Para garantizar que las barras no se solapen
      barPercentage: 0.8,
      categoryPercentage: 0.9,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      // Función que se llama cuando cambia el tamaño de la ventana
      onResize: (chart: Chart) => {
        if (!chart.canvas) return;
        
        // Usar una altura fija para evitar que el gráfico se descontrole
        const newHeight = 430;
        
        if (chart.canvas.parentElement) {
          chart.canvas.parentElement.style.height = `${newHeight}px`;
          chart.canvas.parentElement.style.minHeight = `${newHeight}px`;
          chart.canvas.style.height = `${newHeight}px`;
          
          // Establecer un timeout para permitir que el DOM se actualice
          setTimeout(() => {
            chart.resize();
          }, 100);
        }
      }
    };
  }

  // Los métodos generateChartColors y adjustColorBrightness
  // se han movido al servicio ChartUtilsService
}
