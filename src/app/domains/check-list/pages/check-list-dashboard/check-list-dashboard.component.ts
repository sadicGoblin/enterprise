import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { NgChartsModule } from 'ng2-charts';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Chart, registerables } from 'chart.js';

// Tipado personalizado para los gráficos
type ChartSize = 'small' | 'default' | 'large';

// Registrar los componentes necesarios de Chart.js
Chart.register(...registerables);

// Interfaces para los datos raw del JSON
export interface CheckListRawItem {
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

// Datos procesados para el dashboard
export interface DashboardActivity {
  id: string;
  obra: string;
  usuario: string;
  periodo: string;
  etapaConst: string;
  subProceso: string;
  ambito: string;
  actividad: string;
  periocidad: string;
  dia: string;
  diaCompletado: string;
  fecha: Date;
  diaSemana: string;
  estado: string;
}

// Estructura para datos de heatmap
interface HeatmapDataPoint {
  x: number;
  y: number;
  v: number;
}

@Component({
  selector: 'app-check-list-dashboard',
  templateUrl: './check-list-dashboard.component.html',
  styleUrls: ['./check-list-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    NgChartsModule,
    FormsModule
  ],
  animations: [
    trigger('filterAnimation', [
      state('show', style({
        opacity: 1,
        height: '*',
        transform: 'translateY(0)'
      })),
      state('hide', style({
        opacity: 0,
        height: '0px',
        transform: 'translateY(-20px)',
        overflow: 'hidden'
      })),
      transition('show => hide', [
        animate('0.3s cubic-bezier(0.4, 0.0, 0.2, 1)')
      ]),
      transition('hide => show', [
        animate('0.3s cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class CheckListDashboardComponent implements OnInit, AfterViewInit {
  // Referencias a elementos del DOM para gráficos y paginador
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('donutChart') donutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  
  // Instancias de los gráficos
  charts: Record<string, Chart> = {};
  
  // Datos de actividades
  rawData: CheckListRawItem[] = [];
  activities: DashboardActivity[] = [];
  filteredActivities: DashboardActivity[] = [];
  recentActivities = new MatTableDataSource<DashboardActivity>();
  
  // Opciones de filtros
  projects: string[] = [];
  users: string[] = [];
  scopes: string[] = [];
  periodicities: string[] = [];
  
  // Selecciones de filtros
  showFilters = false;
  selectedProject = '';
  selectedUser = '';
  selectedScope = '';
  
  // Métricas
  totalActivities = 0;
  completedActivities = 0;
  pendingActivities = 0;
  complianceRate = 0;
  totalUsers = 0;
  totalProjects = 0;
  pendingPercentage = 0;
  avgTasksPerUser = 0;
  avgActivitiesPerProject = 0;
  
  // Configuración de tabla
  displayedColumns: string[] = ['obra', 'usuario', 'actividad', 'ambito', 'dia', 'estado'];
  
  // Datos para heatmap
  activityHeatmapData: Record<string, Record<string, number>> = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Inicializar gráficos después de que las referencias del DOM estén disponibles
    setTimeout(() => {
      this.initCharts();
    }, 0);
    
    // Asignar paginador a la tabla
    this.recentActivities.paginator = this.paginator;
  }
  
  /**
   * Carga los datos del dashboard desde un archivo JSON
   */
  private loadDashboardData(): void {
    this.http.get<any>('assets/data/mock-dash.json').subscribe(
      (response) => {
        if (response && response.success && response.data) {
          this.rawData = response.data;
          this.activities = this.rawData.map((item: CheckListRawItem) => this.mapToActivity(item));
          
          // Extraer opciones únicas para los filtros
          this.projects = Array.from(new Set(this.activities.map(a => a.obra)));
          this.users = Array.from(new Set(this.activities.map(a => a.usuario)));
          this.scopes = Array.from(new Set(this.activities.map(a => a.ambito)));
          this.periodicities = Array.from(new Set(this.activities.map(a => a.periocidad)));
          
          console.log('Loaded', this.activities.length, 'activities');
          this.processActivities();
        } else {
          console.error('Invalid response format', response);
          this.generateMockData();
        }
      },
      (error) => {
        console.error('Error loading dashboard data:', error);
        this.generateMockData();
      }
    );
  }
  
  /**
   * Mapea un item raw a una actividad procesada para el dashboard
   */
  private mapToActivity(item: CheckListRawItem): DashboardActivity {
    const day = parseInt(item.dia, 10);
    const year = parseInt(item.Periodo.substring(0, 4), 10);
    const month = parseInt(item.Periodo.substring(4, 6), 10) - 1; // Meses en JS son 0-based
    
    const date = new Date(year, month, day);
    const dayOfWeek = this.getDayOfWeek(date.getDay());
    
    return {
      id: item.IdControl,
      obra: item.Obra,
      usuario: item.Usuario,
      periodo: item.Periodo,
      etapaConst: item.EtapaConst,
      subProceso: item.SubProceso,
      ambito: item.Ambito,
      actividad: item.Actividad,
      periocidad: item.Periocidad,
      dia: item.dia,
      diaCompletado: item.diaCompletado,
      fecha: date,
      diaSemana: dayOfWeek,
      estado: item.diaCompletado === '1' ? 'Completado' : 'Pendiente'
    };
  }
  
  /**
   * Convierte el número de día (0-6) a nombre del día de la semana
   */
  private getDayOfWeek(day: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  }
  
  /**
   * Genera datos de ejemplo cuando no hay datos disponibles
   */
  private generateMockData(): void {
    console.log('Generating mock data');
    
    const mockActivities: DashboardActivity[] = [];
    const obras = ['Edificio Central', 'Torres Norte', 'Residencial Sur', 'Campus Tech'];
    const usuarios = ['Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana Martínez'];
    const ambitos = ['Seguridad', 'Calidad', 'Medio Ambiente', 'Administrativo'];
    const actividades = [
      'Revisar equipos de protección', 
      'Verificar instalaciones', 
      'Inspección de materiales',
      'Control de documentación',
      'Validar permisos',
      'Revisar cumplimiento normativo'
    ];
    const periodicidades = ['Diaria', 'Semanal', 'Mensual'];
    
    // Generar 50 actividades aleatorias
    for (let i = 0; i < 50; i++) {
      const diaNum = Math.floor(Math.random() * 28) + 1;
      const today = new Date();
      const date = new Date(today.getFullYear(), today.getMonth(), diaNum);
      
      mockActivities.push({
        id: `ACT-${1000 + i}`,
        obra: obras[Math.floor(Math.random() * obras.length)],
        usuario: usuarios[Math.floor(Math.random() * usuarios.length)],
        periodo: `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`,
        etapaConst: 'Ejecución',
        subProceso: 'Control',
        ambito: ambitos[Math.floor(Math.random() * ambitos.length)],
        actividad: actividades[Math.floor(Math.random() * actividades.length)],
        periocidad: periodicidades[Math.floor(Math.random() * periodicidades.length)],
        dia: String(diaNum),
        diaCompletado: Math.random() > 0.4 ? '1' : '0',
        fecha: date,
        diaSemana: this.getDayOfWeek(date.getDay()),
        estado: Math.random() > 0.4 ? 'Completado' : 'Pendiente'
      });
    }
    
    this.activities = mockActivities;
    
    // Extraer opciones únicas para los filtros
    this.projects = Array.from(new Set(this.activities.map(a => a.obra)));
    this.users = Array.from(new Set(this.activities.map(a => a.usuario)));
    this.scopes = Array.from(new Set(this.activities.map(a => a.ambito)));
    this.periodicities = Array.from(new Set(this.activities.map(a => a.periocidad)));
    
    this.processActivities();
  }
  
  /**
   * Procesa las actividades para actualizar las métricas y gráficos
   */
  private processActivities(): void {
    // Aplicar filtros
    this.filterActivities();
    
    // Actualizar métricas
    this.updateMetrics();
    
    // Generar datos para el heatmap
    this.generateHeatmapData();
    
    // Actualizar datos de los gráficos
    this.updateChartData();
    
    // Actualizar tabla de actividades recientes (5 más recientes)
    this.recentActivities.data = this.filteredActivities
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 5);
  }
  
  /**
   * Aplica los filtros seleccionados a las actividades
   */
  filterActivities(): void {
    console.log('Filtering activities with:', {
      project: this.selectedProject,
      user: this.selectedUser,
      scope: this.selectedScope
    });
    
    this.filteredActivities = this.activities.filter(activity => {
      const projectMatch = !this.selectedProject || activity.obra === this.selectedProject;
      const userMatch = !this.selectedUser || activity.usuario === this.selectedUser;
      const scopeMatch = !this.selectedScope || activity.ambito === this.selectedScope;
      
      return projectMatch && userMatch && scopeMatch;
    });
    
    console.log('Filtered activities:', this.filteredActivities.length);
  }
  
  /**
   * Actualiza las métricas basadas en actividades filtradas
   */
  updateMetrics(): void {
    const filteredActivities = this.filteredActivities;
    this.totalActivities = filteredActivities.length;
    this.completedActivities = filteredActivities.filter(a => a.estado === 'Completado').length;
    this.pendingActivities = this.totalActivities - this.completedActivities;
    
    // Calcular porcentaje de cumplimiento
    this.complianceRate = this.totalActivities > 0 
      ? Math.round((this.completedActivities / this.totalActivities) * 100)
      : 0;
      
    // Calcular porcentaje de pendientes
    this.pendingPercentage = this.totalActivities > 0
      ? Math.round((this.pendingActivities / this.totalActivities) * 100)
      : 0;
    
    // Contar usuarios y proyectos únicos
    this.totalUsers = new Set(filteredActivities.map(a => a.usuario)).size;
    this.totalProjects = new Set(filteredActivities.map(a => a.obra)).size;
    
    // Calcular promedios
    this.avgTasksPerUser = this.totalUsers > 0
      ? Math.round(this.totalActivities / this.totalUsers)
      : 0;
    
    this.avgActivitiesPerProject = this.totalProjects > 0
      ? Math.round(this.totalActivities / this.totalProjects)
      : 0;
  }
  
  /**
   * Genera los datos para el heatmap de actividades por periodicidad y ámbito
   */
  generateHeatmapData(): void {
    const heatmapData: Record<string, Record<string, number>> = {};
    
    // Inicializar estructura de datos
    this.periodicities.forEach(periodicity => {
      heatmapData[periodicity] = {};
      this.scopes.forEach(scope => {
        heatmapData[periodicity][scope] = 0;
      });
    });
    
    // Rellenar con datos reales
    this.filteredActivities.forEach(activity => {
      const periodicity = activity.periocidad;
      const scope = activity.ambito;
      
      if (heatmapData[periodicity] && heatmapData[periodicity][scope] !== undefined) {
        heatmapData[periodicity][scope]++;
      }
    });
    
    this.activityHeatmapData = heatmapData;
  }
  
  /**
   * Actualiza los datos de todos los gráficos
   */
  updateChartData(): void {
    if (this.charts['donut']) {
      this.charts['donut'].data = this.getDonutChartData();
      this.charts['donut'].update();
    }
    
    if (this.charts['line']) {
      this.charts['line'].data = this.getLineChartData();
      this.charts['line'].update();
    }
    
    if (this.charts['bar']) {
      this.charts['bar'].data = this.getBarChartData();
      this.charts['bar'].update();
    }
  }
  
  /**
   * Inicializa las instancias de los gráficos
   */
  private initCharts(): void {
    console.log('Initializing charts');
    
    try {
      if (this.donutChartRef) {
        const ctx = this.donutChartRef.nativeElement.getContext('2d');
        if (ctx) {
          this.charts['donut'] = new Chart(ctx, {
            type: 'doughnut',
            data: this.getDonutChartData(),
            options: this.getDonutChartOptions()
          });
        }
      }
      
      if (this.lineChartRef) {
        const ctx = this.lineChartRef.nativeElement.getContext('2d');
        if (ctx) {
          this.charts['line'] = new Chart(ctx, {
            type: 'line',
            data: this.getLineChartData(),
            options: this.getLineChartOptions()
          });
        }
      }
      
      if (this.barChartRef) {
        const ctx = this.barChartRef.nativeElement.getContext('2d');
        if (ctx) {
          // Configurar altura adecuada para mostrar todos los proyectos
          const projectCount = this.filteredActivities ? new Set(this.filteredActivities.map(a => a.obra)).size : 0;
          const canvasHeight = Math.max(projectCount * 30, 300); // 30px por proyecto, mínimo 300px
          
          // Configurar el canvas con una altura que permita ver todos los proyectos
          this.barChartRef.nativeElement.height = canvasHeight;
          
          this.charts['bar'] = new Chart(ctx, {
            type: 'bar',
            data: this.getBarChartData(),
            options: this.getBarChartOptions()
          });
        }
      }
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }
  
  /**
   * Obtiene los datos para el gráfico de dona (total asignado vs cumplido)
   */
  private getDonutChartData(): any {
    // Calcular totales generales
    const totalAssigned = this.filteredActivities.length;
    const totalCompleted = this.filteredActivities.filter(a => a.diaCompletado === "1").length;
    
    // Crear un array de datos para el gráfico
    const data = [totalAssigned, totalCompleted];
    
    // Definir colores para cada categoría
    const colors = ['#3B82F6', '#10B981'];
    
    return {
      labels: ['Asignadas', 'Completadas'],
      datasets: [{
        data: data,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map(color => this.adjustColorBrightness(color, 20)),
        borderWidth: 1
      }]
    };
  }
  
  /**
   * Opciones para el gráfico de dona
   */
  private getDonutChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: 'Total Actividades: Asignadas vs Completadas',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: {
            bottom: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }
  
  /**
   * Obtiene los datos para el gráfico de línea (cumplimiento diario)
   */
  private getLineChartData(): any {
    // Agrupar por día y contar actividades asignadas vs completadas
    const dates = Array.from(new Set(this.filteredActivities.map(a => a.dia)));
    dates.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    
    // Conteo de actividades asignadas por día
    const assignedData = dates.map(day => {
      return this.filteredActivities.filter(a => a.dia === day).length;
    });
    
    // Conteo de actividades completadas por día (diaCompletado = "1")
    const completedData = dates.map(day => {
      return this.filteredActivities.filter(a => a.dia === day && a.diaCompletado === "1").length;
    });
    
    return {
      labels: dates.map(day => `Día ${day}`),
      datasets: [
        {
          label: 'Actividades Asignadas',
          data: assignedData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          order: 1
        },
        {
          label: 'Actividades Completadas',
          data: completedData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          order: 2
        }
      ]
    };
  }
  
  /**
   * Opciones para el gráfico de línea
   */
  private getLineChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grace: '10%',
          ticks: {
            precision: 0
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
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
            }
          }
        },
        title: {
          display: true,
          text: 'Actividades Asignadas vs. Completadas por Día',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: {
            bottom: 20
          }
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
    };
  }
  
  /**
   * Obtiene los datos para el gráfico de barras (cumplimiento por proyecto)
   */
  private getBarChartData(): any {
    // Obtenemos la lista de proyectos y calculamos sus métricas
    const projects = Array.from(new Set(this.filteredActivities.map(a => a.obra)));
    
    // Crear un array con los datos de cada proyecto
    const projectData = projects.map(project => {
      const projectActivities = this.filteredActivities.filter(a => a.obra === project);
      const assignedCount = projectActivities.length;
      const completedCount = projectActivities.filter(a => a.diaCompletado === "1").length;
      const completionRate = assignedCount > 0 ? (completedCount / assignedCount) * 100 : 0;
      
      return {
        name: project,
        assigned: assignedCount,
        completed: completedCount,
        rate: Math.round(completionRate)
      };
    });
    
    // Ordenar proyectos de mayor a menor tasa de cumplimiento
    projectData.sort((a, b) => b.rate - a.rate);
    
    // Extraer los datos ordenados para el gráfico
    const sortedProjects = projectData.map(p => p.name);
    const assignedCounts = projectData.map(p => p.assigned);
    const completedCounts = projectData.map(p => p.completed);
    
    // Límite de caracteres para nombres de proyectos largos
    const truncatedProjects = sortedProjects.map(name => {
      return name.length > 20 ? name.substring(0, 18) + '...' : name;
    });
    
    return {
      labels: truncatedProjects,
      datasets: [
        {
          label: 'Asignadas',
          data: assignedCounts,
          backgroundColor: '#3B82F6',
          borderColor: this.adjustColorBrightness('#3B82F6', -20),
          borderWidth: 1,
          borderRadius: 5,
          maxBarThickness: 35,
          order: 2
        },
        {
          label: 'Completadas',
          data: completedCounts,
          backgroundColor: '#10B981',
          borderColor: this.adjustColorBrightness('#10B981', -20),
          borderWidth: 1,
          borderRadius: 5,
          maxBarThickness: 35,
          order: 1
        }
      ]
    };
  }
  
  /**
   * Opciones para el gráfico de barras
   */
  private getBarChartOptions(): any {
    // Calcular altura mínima necesaria para el gráfico (30px por proyecto)
    const projectCount = this.filteredActivities ? new Set(this.filteredActivities.map(a => a.obra)).size : 0;
    const minHeight = Math.max(projectCount * 30, 300); // Mínimo 300px, o más si hay muchos proyectos
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      layout: {
        padding: {
          top: 0,
          right: 5,
          bottom: 0,
          left: 5
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          stacked: false,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        },
        y: {
          stacked: false,
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 10
            }
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
            padding: 15,
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: 'Actividades por Proyecto (Ordenados por Tasa de Cumplimiento)',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: {
            bottom: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.dataset.label || '';
              const value = context.parsed.x || 0;
              return `${label}: ${value}`;
            }
          }
        }
      }
    };
  }
  
  /**
   * Genera una paleta de colores para los gráficos
   */
  private generateChartColors(count: number): string[] {
    const baseColors = [
      '#1E88E5', '#42A5F5', '#90CAF9',
      '#26A69A', '#4DB6AC', '#80CBC4',
      '#7CB342', '#9CCC65', '#C5E1A5',
      '#FFB300', '#FFD54F', '#FFE082',
      '#F4511E', '#FF8A65', '#FFAB91'
    ];
    
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  }
  
  /**
   * Ajusta el brillo de un color hexadecimal
   */
  private adjustColorBrightness(hex: string, percent: number): string {
    // Convertir hex a RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Ajustar brillo
    r = Math.min(255, Math.max(0, Math.round(r * (1 + percent / 100))));
    g = Math.min(255, Math.max(0, Math.round(g * (1 + percent / 100))));
    b = Math.min(255, Math.max(0, Math.round(b * (1 + percent / 100))));
    
    // Convertir de nuevo a hex
    return '#' + 
      r.toString(16).padStart(2, '0') + 
      g.toString(16).padStart(2, '0') + 
      b.toString(16).padStart(2, '0');
  }
  
  /**
   * Maneja el cambio en los filtros y actualiza los datos
   */
  onFilterChange(): void {
    this.processActivities();
  }
  
  /**
   * Alterna la visibilidad del panel de filtros
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  /**
   * Limpia todos los filtros aplicados
   */
  clearFilters(): void {
    this.selectedProject = '';
    this.selectedUser = '';
    this.selectedScope = '';
    this.processActivities();
  }
  
  /**
   * Genera un color para la celda del heatmap basado en el valor
   * @param value Número de actividades
   * @returns Color en formato hexadecimal o rgba
   */
  getHeatmapColor(value: number): string {
    // Si no hay actividades, devolver un gris claro
    if (value === 0) {
      return '#f5f5f5';
    }
    
    // Calcular la intensidad basada en el valor (asumiendo un máximo de 20)
    const maxValue = 20;
    const normalizedValue = Math.min(value / maxValue, 1);
    
    // Usar una escala de verde (más claro a más oscuro)
    const baseColor = 120; // Tono verde en HSL
    const lightness = 90 - (normalizedValue * 50); // Del 90% al 40% de lightness
    
    return `hsl(${baseColor}, 70%, ${lightness}%)`;
  }
}
