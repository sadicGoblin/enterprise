import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';

// Importaciones de componentes de gráficos
import { MetricsCardsComponent } from './charts/metrics-cards.component';
import { DonutChartComponent } from './charts/donut-chart.component';
import { BarChartComponent } from './charts/bar-chart.component';
import { LineChartComponent } from './charts/line-chart.component';
import { HeatmapComponent } from './charts/heatmap.component';
import { RecentActivitiesComponent } from './charts/recent-activities.component';
// Importamos el componente de proyectos activos
import { ActiveProjectsCardComponent } from './charts/active-projects-card/active-projects-card.component';

// Tipado personalizado para los datos de gráficos
interface BarChartData {
  projects: string[];
  completionRates: number[];
}

interface LineChartData {
  labels: string[];
  completionData: number[];
}

interface DonutChartData {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

interface HeatmapData {
  periodicities: string[];
  scopes: string[];
  data: { [periodicity: string]: { [scope: string]: number } };
}

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
  standalone: true,
  templateUrl: './check-list-dashboard.component.html',
  styleUrls: ['./check-list-dashboard.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MetricsCardsComponent,
    DonutChartComponent,
    BarChartComponent,
    LineChartComponent,
    HeatmapComponent,
    RecentActivitiesComponent,
    ActiveProjectsCardComponent
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
  // Datos para gráficos
  barChartData: BarChartData = { projects: [], completionRates: [] };
  lineChartData: LineChartData = { labels: [], completionData: [] };
  donutChartData: DonutChartData = { labels: [], data: [], backgroundColor: [] };
  heatmapData: HeatmapData = { periodicities: [], scopes: [], data: {} };
  
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
    // Ya no necesitamos hacer nada aquí
    // Los componentes de gráficos se encargarán de inicializarse
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
   * Prepara los datos para todos los componentes de gráficos
   */
  updateChartData(): void {
    // Preparar datos para los gráficos
    this.prepareDonutChartData();
    this.prepareLineChartData();
    this.prepareBarChartData();
    
    // Datos para heatmap
    this.heatmapData = {
      periodicities: this.periodicities,
      scopes: this.scopes,
      data: this.activityHeatmapData
    };
  }
  
  /**
   * Prepara los datos para el gráfico de dona (completado vs pendiente)
   */
  prepareDonutChartData(): void {
    this.donutChartData = {
      labels: ['Completado', 'Pendiente'],
      data: [this.completedActivities, this.pendingActivities],
      backgroundColor: ['#4caf50', '#ff9800']
    };
  }
  
  /**
   * Prepara los datos para el gráfico de línea (tendencia de cumplimiento diario)
   */
  prepareLineChartData(): void {
    // Agrupar actividades por día y calcular tasas de cumplimiento
    const dailyCompletionMap = new Map<string, {completed: number, total: number}>();
    
    // Obtener los últimos 7 días para mostrar en el gráfico
    const today = new Date();
    const labels: string[] = [];
    
    // Inicializar datos para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // formato YYYY-MM-DD
      labels.push(dateStr);
      dailyCompletionMap.set(dateStr, {completed: 0, total: 0});
    }
    
    // Contar actividades completadas y totales por día
    this.filteredActivities.forEach(activity => {
      const dateStr = activity.fecha.toISOString().split('T')[0];
      if (dailyCompletionMap.has(dateStr)) {
        const data = dailyCompletionMap.get(dateStr)!;
        data.total++;
        if (activity.estado === 'Completado') {
          data.completed++;
        }
      }
    });
    
    // Calcular tasa de cumplimiento diario
    const completionData = labels.map(date => {
      const data = dailyCompletionMap.get(date)!;
      return data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    });
    
    this.lineChartData = {
      labels,
      completionData
    };
  }
  
  /**
   * Prepara los datos para el gráfico de barras (cumplimiento por proyecto)
   */
  prepareBarChartData(): void {
    const projectCompletionMap = new Map<string, {completed: number, total: number}>();
    
    // Inicializar datos por proyecto
    this.projects.forEach(project => {
      projectCompletionMap.set(project, {completed: 0, total: 0});
    });
    
    // Contar actividades completadas y totales por proyecto
    this.filteredActivities.forEach(activity => {
      if (projectCompletionMap.has(activity.obra)) {
        const data = projectCompletionMap.get(activity.obra)!;
        data.total++;
        if (activity.estado === 'Completado') {
          data.completed++;
        }
      }
    });
    
    // Generar arrays para el gráfico, ordenando por tasa de cumplimiento
    const projectData = Array.from(projectCompletionMap.entries())
      .filter(([_, data]) => data.total > 0) // Solo incluir proyectos con actividades
      .map(([project, data]) => ({
        project,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate) // Ordenar de mayor a menor
      .slice(0, 10); // Mostrar top 10 proyectos
    
    this.barChartData = {
      projects: projectData.map(d => d.project),
      completionRates: projectData.map(d => d.completionRate)
    };
  }
  
  /**
   * Genera un color para la celda del heatmap basado en el valor
   * @param value Número de actividades
   * @returns Color en formato hexadecimal o rgba
   */
  getHeatmapColor(value: number): string {
    if (value === 0) {
      return '#f5f5f5'; // Gris claro para celdas sin actividades
    }
    
    // Escala de colores de frío a caliente basado en la intensidad
    // Valor bajo: azul claro, Valor medio: amarillo, Valor alto: rojo
    const intensity = Math.min(value / 10, 1); // Normalizar en rango 0-1, máximo 10 actividades
    
    if (intensity < 0.3) {
      return `rgba(135, 206, 250, ${intensity + 0.2})`; // Azul claro
    } else if (intensity < 0.7) {
      return `rgba(255, 255, 0, ${intensity + 0.2})`; // Amarillo
    } else {
      return `rgba(255, 0, 0, ${intensity + 0.2})`; // Rojo
    }
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
  processActivities(): void {
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
}
