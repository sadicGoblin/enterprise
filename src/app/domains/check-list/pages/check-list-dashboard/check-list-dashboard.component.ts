import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { trigger, transition, style, animate, state } from '@angular/animations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PlanificationService } from '../../services/planification.service';

// Importaciones de componentes de gráficos
import { MetricsCardsComponent } from './charts/metrics-cards.component';
import { DonutChartComponent } from './charts/donut-chart.component';
import { BarChartComponent } from './charts/bar-chart.component';
import { LineChartComponent } from './charts/line-chart.component';
import { HeatmapComponent } from './charts/heatmap.component';
import { RecentActivitiesComponent } from './charts/recent-activities.component';
// Importamos el componente de Top 5 Usuarios
import { ActiveProjectsCardComponent } from './charts/active-projects-card.component';

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

// Interfaz para almacenar elementos del DOM y sus estilos originales
interface ParentElement {
  element: HTMLElement;
  originalOverflow: string;
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
    MatTableModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
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
  selectedPeriod = '';
  periodOptions: string[] = [];
  
  // Control de estado de carga
  isLoading = false;
  
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
  


  constructor(
    private http: HttpClient,
    private planificationService: PlanificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.generatePeriodOptions();
  }
  
  /**
   * Genera las opciones de período para los últimos 12 meses en formato YYYYMM
   */
  private generatePeriodOptions(): void {
    const today = new Date();
    this.periodOptions = [];
    
    // Formato actual YYYYMM
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() devuelve 0-11
    
    // Establecer el período actual como valor por defecto
    this.selectedPeriod = `${currentYear}${currentMonth.toString().padStart(2, '0')}`;
    
    // Generar opciones para los últimos 12 meses
    for (let i = 0; i < 12; i++) {
      let year = currentYear;
      let month = currentMonth - i;
      
      // Ajustar para meses anteriores al año actual
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      // Formatear como YYYYMM
      const period = `${year}${month.toString().padStart(2, '0')}`;
      this.periodOptions.push(period);
    }
  }

  ngAfterViewInit(): void {
    // Ya no necesitamos hacer nada aquí
    // Los componentes de gráficos se encargarán de inicializarse
  }
  

  


  /**
   * Carga los datos del dashboard desde el servicio de planificación
   */
  private loadDashboardData(): void {
    // Activar indicador de carga
    this.isLoading = true;
    
    // Asegurarse de que el período esté definido antes de hacer la llamada
    if (!this.selectedPeriod && this.periodOptions.length > 0) {
      this.selectedPeriod = this.periodOptions[0];
    }
    
    // Usar el período actual por defecto si no hay opciones o período seleccionado
    if (!this.selectedPeriod) {
      const today = new Date();
      this.selectedPeriod = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    console.log(`[Dashboard] Cargando datos de planificación para el período: ${this.selectedPeriod}`);
    
    // Llamar al servicio de planificación
    this.planificationService.getControlPlanificacion(this.selectedPeriod).subscribe(
      (response) => {
        
        if (response) {
          console.log('response', response.data);
          this.rawData = response.data;
          this.activities = this.rawData.map((item: CheckListRawItem) => this.mapToActivity(item));
          
          // Extraer opciones únicas para los filtros
          this.projects = Array.from(new Set(this.activities.map(a => a.obra)));
          this.users = Array.from(new Set(this.activities.map(a => a.usuario)));
          this.scopes = Array.from(new Set(this.activities.map(a => a.ambito)));
          this.periodicities = Array.from(new Set(this.activities.map(a => a.periocidad)));
          
          console.log('[Dashboard] Cargadas', this.activities.length, 'actividades');
          this.processActivities();
          // Desactivar indicador de carga
          this.isLoading = false;
        } else {
          console.error('Formato de respuesta inválido', response);
          this.loadFromMock();
        }
      },
      (error) => {
        console.error('Error al cargar datos de planificación:', error);
        this.loadFromMock();
      },
      () => {
        // Completado (siempre se ejecuta al finalizar, sea éxito o error)
        // Desactivar indicador de carga si aún está activo
        if (this.isLoading) {
          this.isLoading = false;
        }
      }
    );
  }

  /**
   * Carga datos desde el mock como respaldo
   */
  private loadFromMock(): void {
    console.log('[Dashboard] Cargando datos desde el mock como respaldo');
    
    // Código original que carga desde el mock
    this.http.get<any>('assets/data/mock-dash.json').subscribe(
      (response) => {
        if (response && response.ok && response.actividades) {
          this.rawData = response.actividades;
          this.activities = this.rawData.map((item: CheckListRawItem) => this.mapToActivity(item));
          
          // Extraer opciones únicas para los filtros
          this.projects = Array.from(new Set(this.activities.map(a => a.obra)));
          this.users = Array.from(new Set(this.activities.map(a => a.usuario)));
          this.scopes = Array.from(new Set(this.activities.map(a => a.ambito)));
          this.periodicities = Array.from(new Set(this.activities.map(a => a.periocidad)));
          
          console.log('[Dashboard] Cargadas', this.activities.length, 'actividades desde el mock');
          this.processActivities();
          this.isLoading = false;
        } else {
          console.error('Formato de respuesta del mock inválido', response);
          this.generateMockData();
          this.isLoading = false;
        }
      },
      (error) => {
        console.error('Error al cargar datos del mock:', error);
        this.generateMockData();
        this.isLoading = false;
      }
      // No es necesario el complete() aquí ya que siempre manejamos el estado en éxito y error
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
  private filterActivities(): void {
    console.log('Filtering activities with:', {
      project: this.selectedProject,
      user: this.selectedUser,
      scope: this.selectedScope,
      period: this.selectedPeriod
    });
    
    this.filteredActivities = this.activities.filter(activity => {
      const projectMatch = !this.selectedProject || activity.obra === this.selectedProject;
      const userMatch = !this.selectedUser || activity.usuario === this.selectedUser;
      const scopeMatch = !this.selectedScope || activity.ambito === this.selectedScope;
      
      // Por ahora, no aplicamos filtro de período ya que requeriría una propiedad de fecha
      // que actualmente no está en los datos. Esto se implementaría en una siguiente fase
      // cuando los datos incluyan información de fecha.
      
      return projectMatch && userMatch && scopeMatch;
    });
    
    if (this.selectedPeriod) {
      const year = this.selectedPeriod.substring(0, 4);
      const month = this.selectedPeriod.substring(4);
      console.log(`Período seleccionado (para futura implementación): ${month}/${year}`);
    }
    
    console.log('Filtered activities:', this.filteredActivities.length);
    this.recentActivities.data = this.filteredActivities.slice(0, 5);
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
    // Si cambió el período, recargamos los datos desde el servicio
    // ya que necesitamos datos diferentes para el nuevo período
    const previousPeriod = localStorage.getItem('selectedPeriod');
    
    if (this.selectedPeriod && this.selectedPeriod !== previousPeriod) {
      console.log(`Período cambiado de ${previousPeriod || 'ninguno'} a ${this.selectedPeriod}`);
      localStorage.setItem('selectedPeriod', this.selectedPeriod);
      
      // Recargar los datos completos para el nuevo período
      this.loadDashboardData();
    } else {
      // Para el resto de filtros, simplemente filtramos los datos existentes
      this.processActivities();
    }
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
    this.selectedPeriod = new Date().getFullYear().toString() + (new Date().getMonth() + 1).toString().padStart(2, '0');
    this.processActivities();
  }

  /**
   * Descarga los datos en formato Excel
   */
  downloadExcel(): void {
    console.log('[Dashboard] Descargando datos en formato Excel', this.filteredActivities);
    // Aquí iría la lógica para exportar a Excel
  }

  /**
   * Genera un reporte en formato PDF del dashboard combinando todas las secciones
   * en una única página grande
   */
  generatePDF(): void {
    // Mostrar indicador de carga
    this.isLoading = true;
    
    // Generar título para el PDF basado en los filtros activos
    let pdfTitle = `Dashboard de Actividades - Período ${this.selectedPeriod}`;
    if (this.selectedProject) pdfTitle += ` - Proyecto: ${this.selectedProject}`;
    if (this.selectedUser) pdfTitle += ` - Usuario: ${this.selectedUser}`;
    if (this.selectedScope) pdfTitle += ` - Ámbito: ${this.selectedScope}`;
    
    // Configuraciones básicas para la captura
    const options = {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    };
    
    // Seleccionar las secciones principales sin importar los separadores
    const metricsSection = document.querySelector('.metrics-section') as HTMLElement;
    
    // Para las filas de gráficos, tenemos que ser más específicos porque hay 3 filas
    // La primera fila normal de gráficos (dona y barras)
    const firstChartsRow = document.querySelector('.charts-row:not(.full-width-chart)') as HTMLElement;
    
    // La última fila de gráficos (heatmap y proyectos activos)
    const secondChartsRow = document.querySelector('.charts-row:nth-of-type(3)') as HTMLElement;
    
    // Sección de actividades recientes
    const activitiesSection = document.querySelector('.activities-section') as HTMLElement;
    
    console.log('Secciones encontradas para PDF:', {
      metricas: metricsSection ? true : false,
      grafico1: firstChartsRow ? true : false,
      grafico2: secondChartsRow ? true : false,
      actividades: activitiesSection ? true : false
    });
    
    // Verificar si se encontraron todas las secciones necesarias
    if (!metricsSection || !firstChartsRow || !secondChartsRow || !activitiesSection) {
      console.error('No se encontraron todas las secciones del dashboard para el PDF');
      this.isLoading = false;
      return;
    }
    
    // Lista de secciones a capturar (siempre las 4 secciones fijas)
    const sections = [
      { element: metricsSection, title: 'Métricas Principales' },
      { element: firstChartsRow, title: 'Gráficos de Distribución' },
      { element: secondChartsRow, title: 'Actividad por Categorías' },
      { element: activitiesSection, title: 'Actividades Recientes' }
    ];
    
    // Mantener registro de elementos temporales creados para limpiar después
    const temporaryElements: HTMLElement[] = [];
    
    // El PDF tendrá 2 secciones por página - Primera página: Métricas y Gráficos 1, Segunda página: Gráficos 2 y Actividades
    
    // Función para preparar un elemento antes de la captura
    const prepareElement = (element: HTMLElement): {
      originalStyles: { [key: string]: string },
      parents: ParentElement[]
    } => {
      // Guardar estilos originales
      const originalStyles = {
        width: element.style.width,
        height: element.style.height,
        position: element.style.position,
        overflow: element.style.overflow
      };
      
      // Configurar para la captura
      element.style.width = element.scrollWidth + 'px';
      element.style.height = 'auto';
      element.style.overflow = 'visible';
      
      // Preparar padres
      const parents: ParentElement[] = [];
      let parent = element.parentElement;
      
      while (parent) {
        parents.push({
          element: parent,
          originalOverflow: parent.style.overflow
        });
        parent.style.overflow = 'visible';
        parent = parent.parentElement;
      }
      
      return { originalStyles, parents };
    };
    
    // Función para restaurar un elemento después de la captura
    const restoreElement = (element: HTMLElement, data: {
      originalStyles: { [key: string]: string },
      parents: ParentElement[]
    }) => {
      // Restaurar estilos del elemento
      Object.keys(data.originalStyles).forEach(key => {
        element.style[key as any] = data.originalStyles[key];
      });
      
      // Restaurar padres
      data.parents.forEach(p => {
        p.element.style.overflow = p.originalOverflow;
      });
    };

    // Array para almacenar las imágenes de cada sección
    const sectionImages: {image: string, width: number, height: number}[] = [];
    
    // Función para procesar cada sección de forma secuencial
    const processSectionAtIndex = (index: number) => {
      if (index >= sections.length) {
        // Todas las secciones han sido procesadas, ahora combinamos en un único PDF grande
        createCompletePDF();
        return;
      }
      
      const section = sections[index];
      const elementData = prepareElement(section.element);
      
      try {
        // Capturar la sección actual
        html2canvas(section.element, options).then(canvas => {
          // Obtener imagen y dimensiones
          const imgData = canvas.toDataURL('image/png');
          const width = canvas.width;
          const height = canvas.height;
          
          // Guardar la imagen de esta sección
          sectionImages.push({ image: imgData, width, height });
          
          // Restaurar el elemento a su estado original
          restoreElement(section.element, elementData);
          
          // Procesar la siguiente sección
          processSectionAtIndex(index + 1);
        }).catch(error => {
          console.error(`Error al capturar sección ${section.title}:`, error);
          restoreElement(section.element, elementData);
          processSectionAtIndex(index + 1); // Continuar con la siguiente sección a pesar del error
        });
      } catch (error) {
        console.error(`Error al procesar sección ${section.title}:`, error);
        restoreElement(section.element, elementData);
        processSectionAtIndex(index + 1);
      }
    };

    // Función para crear el PDF final con 2 secciones por página
    const createCompletePDF = () => {
      // Configuración de PDF (A4 landscape)
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = 277; // Ancho A4 landscape menos márgenes
      const pageHeight = 190; // Altura útil para contenido en A4 landscape

      // Añadir título y fecha
      const date = new Date();
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      // Contador de páginas
      let currentPage = 0;
      
      // Distribuir secciones: 2 por página
      for (let i = 0; i < sectionImages.length; i += 2) {
        // Añadir nueva página si no es la primera sección
        if (i > 0) {
          pdf.addPage();
        }
        currentPage++;
        
        // Encabezado de la página (mínimo espacio)
        pdf.setFontSize(7);
        pdf.text(pdfTitle, 10, 10);
        pdf.setFontSize(5);
        pdf.text(`Generado el: ${dateStr} | Página ${currentPage}`, 10, 15);
        
        // Primera sección en esta página
        const img1 = sectionImages[i];
        
        // Añadir título de la primera sección (mínimo espacio)
        let yPosition = 20; // Posición inicial muy reducida
        pdf.setFontSize(6);
        pdf.text(sections[i].title, 10, yPosition);
        yPosition += 3; // Mínimo espacio tras el título
        
        // Calcular dimensiones de la primera imagen (ancho máximo, márgenes mínimos)
        const imgWidth1 = 287; // Ancho máximo con márgenes mínimos
        const imgHeight1 = (img1.height * imgWidth1) / img1.width;
        
        // Añadir la primera imagen
        pdf.addImage(img1.image, 'PNG', 5, yPosition, imgWidth1, imgHeight1);
        
        // Calcular posición para la segunda sección
        yPosition += imgHeight1 + 3; // Mínimo espacio entre imágenes
        
        // Comprobar si existe una segunda sección para esta página
        if (i + 1 < sectionImages.length) {
          const img2 = sectionImages[i + 1];
          
          // Añadir título de la segunda sección
          pdf.setFontSize(6);
          pdf.text(sections[i + 1].title, 10, yPosition);
          yPosition += 3; // Mínimo espacio tras el título
          
          // Calcular dimensiones de la segunda imagen
          const imgWidth2 = 287; // Ancho máximo con márgenes mínimos
          const imgHeight2 = (img2.height * imgWidth2) / img2.width;
          
          // Añadir la segunda imagen
          pdf.addImage(img2.image, 'PNG', 5, yPosition, imgWidth2, imgHeight2);
        }
      }
      
      // Guardar el PDF
      pdf.save(`dashboard-actividades-${this.selectedPeriod}.pdf`);
      
      // Eliminar todos los elementos temporales del DOM
      temporaryElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      
      // Ocultar indicador de carga
      this.isLoading = false;
    };
    
    // Iniciar el procesamiento con la primera sección
    processSectionAtIndex(0);
  }
}
