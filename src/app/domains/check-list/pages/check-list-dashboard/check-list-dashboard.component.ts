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

// Interfaces para los datos raw del JSON

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
  


  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Ya no necesitamos hacer nada aquí
    // Los componentes de gráficos se encargarán de inicializarse
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
    
    // Arrays para generar datos aleatorios
    const obras = ['Edificio Central', 'Torres Norte', 'Residencial Sur', 'Campus Tech'];
    const usuarios = ['Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana Martínez'];
    const ambitos = ['Seguridad', 'Calidad', 'Medio Ambiente', 'Administrativo'];
    const actividades = ['Revisar equipos', 'Verificar instalaciones', 'Control de documentos'];
    const periodicidades = ['Diaria', 'Semanal', 'Mensual'];
    
    // Generar 20 actividades aleatorias (reducido de 50 para mayor eficiencia)
    const mockActivities: DashboardActivity[] = [];
    for (let i = 0; i < 20; i++) {
      const diaNum = Math.floor(Math.random() * 28) + 1;
      const today = new Date();
      const date = new Date(today.getFullYear(), today.getMonth(), diaNum);
      const isCompleted = Math.random() > 0.4;
      
      mockActivities.push({
        id: `ACT-${1000 + i}`,
        obra: obras[i % obras.length],
        usuario: usuarios[i % usuarios.length],
        periodo: `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`,
        etapaConst: 'Ejecución',
        subProceso: 'Control',
        ambito: ambitos[i % ambitos.length],
        actividad: actividades[i % actividades.length],
        periocidad: periodicidades[i % periodicidades.length],
        dia: String(diaNum),
        diaCompletado: isCompleted ? '1' : '0',
        fecha: date,
        diaSemana: this.getDayOfWeek(date.getDay()),
        estado: isCompleted ? 'Completado' : 'Pendiente'
      });
    }
    
    this.activities = mockActivities;
    this.rawData = mockActivities.map(a => ({
      IdControl: a.id,
      Obra: a.obra,
      Usuario: a.usuario,
      Periodo: a.periodo,
      EtapaConst: a.etapaConst,
      SubProceso: a.subProceso,
      Ambito: a.ambito,
      Actividad: a.actividad,
      Periocidad: a.periocidad,
      dia: a.dia,
      diaCompletado: a.diaCompletado
    }));
    
    // Extraer opciones únicas para los filtros
    this.projects = [...new Set(mockActivities.map(a => a.obra))];
    this.users = [...new Set(mockActivities.map(a => a.usuario))];
    this.scopes = [...new Set(mockActivities.map(a => a.ambito))];
    this.periodicities = [...new Set(mockActivities.map(a => a.periocidad))];
    
    this.processActivities();
  }
  
  /**
   * Procesa las actividades para actualizar las métricas
   */
  processActivities(): void {
    // Aplicar filtros
    this.filterActivities();
    
    // Actualizar métricas
    this.updateMetrics();
    
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
