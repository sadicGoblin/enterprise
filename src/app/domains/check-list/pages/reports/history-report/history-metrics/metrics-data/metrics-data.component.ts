import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicChartComponent } from './dynamic-chart/dynamic-chart.component';
import { SummaryKpiComponent } from './summary-kpi/summary-kpi.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import Chart from 'chart.js/auto';

// Importar el modelo de configuración de reportes
import { ReportConfig } from '../../models/report-config.model';
import { HierarchicalFilterItem } from '../../../../../models/hierarchical-filter.model';

@Component({
  selector: 'app-metrics-data',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatCardModule, 
    MatDividerModule, 
    MatTooltipModule,
    MatButtonModule,
    DynamicChartComponent,
    SummaryKpiComponent
  ],
  templateUrl: './metrics-data.component.html',
  styleUrls: ['./metrics-data.component.scss']
})
export class MetricsDataComponent implements OnChanges, AfterViewInit {
  @Input() data: any[] = [];         // Datos filtrados para mostrar en las métricas y gráficos
  @Input() completeData: any[] = []; // Datos completos sin filtrar (para SummaryKpi)
  @Input() activeFilters: {[key: string]: string[]} = {};
  @Input() reportConfig?: ReportConfig;
  @Input() hierarchicalFilters: HierarchicalFilterItem[] = [];
  
  // Sistema de exportación masiva
  selectedForExport: Set<string> = new Set();
  exportMode: boolean = false;
  
  // Referencias a los elementos del DOM para los gráficos
  @ViewChild('estadosChart') estadosChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tiposChart') tiposChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Instancias de los gráficos
  private estadosChart: Chart | null = null;
  private tiposChart: Chart | null = null;
  
  // Datos procesados para métricas
  totalRegistros = 0;
  registrosPorTipo: {[key: string]: number} = {};
  registrosPorEstado: {[key: string]: number} = {};
  registrosPorObra: {[key: string]: number} = {};
  registrosPorUsuario: {[key: string]: number} = {};
  _hierarchicalFilters: HierarchicalFilterItem[] = [];
  
  // Gráficos dinámicos por filtros activos
  dynamicCharts: {filterType: string, fieldName: string, selectedValues?: string[]}[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    // console.log('MetricsDataComponent - ngOnChanges:', { 
    //   data: changes['data']?.currentValue?.length || 0, 
    //   activeFilters: changes['activeFilters']?.currentValue, 
    //   hasFilters: changes['activeFilters'] && Object.keys(changes['activeFilters'].currentValue || {}).length > 0
    // });
    // console.log('[MetricsDataComponent] - ngOnChanges - handleHierarchicalFiltersChange1:', this.hierarchicalFilters);
    if (changes['hierarchicalFilters'] && this.hierarchicalFilters != null) {
      this._hierarchicalFilters = [...this.hierarchicalFilters];
      console.log('[MetricsDataComponent] - ngOnChanges - handleHierarchicalFiltersChange2:', this._hierarchicalFilters);
      this.procesarDatos();
    }
    
    // if ((changes['data'] && this.data) || changes['hierarchicalFilters']) {
    //   this.procesarDatos();
    // }

    

  }
  
  /**
   * Procesa los datos para generar métricas y gráficos de forma dinámica
   * sin depender de nombres de campos específicos
   */
  procesarDatos(): void {
        this.dynamicCharts = [];
        // Agregar configuración para este filtro
        const sortedFilters = [...this.hierarchicalFilters].sort((a, b) => a.position - b.position);
      
      // Apply each filter in order using for...of to allow break statements
      for (const filter of sortedFilters) {
        if (filter.filters && filter.filters.length > 0) {
          const filterType = filter.filterType;
          const fieldName = this.getFieldNameFromFilterType(filterType);
          this.dynamicCharts.push({
            filterType: this.getFilterDisplayName(filterType),
            fieldName,
            selectedValues: []
          });
        }
      }
  }
  
  /**
   * Detecta qué campos de un objeto contienen cadenas de texto (strings)
   * @param objeto Objeto de muestra para analizar
   * @returns Array con los nombres de los campos que contienen strings
   */
  private detectarCamposCadena(objeto: any): string[] {
    if (!objeto || typeof objeto !== 'object') {
      return [];
    }
    
    return Object.keys(objeto).filter(key => {
      const valor = objeto[key];
      return typeof valor === 'string' || valor instanceof String;
    });
  }
  
  /**
   * Convierte el tipo de filtro a un nombre de campo en los datos
   * Ahora es completamente genérico sin mapeo hardcodeado
   * @param filterType Tipo de filtro
   * @returns Nombre del campo correspondiente
   */
  private getFieldNameFromFilterType(filterType: string): string {
    // Si tenemos datos, buscamos campos que coincidan con el tipo de filtro
    if (this.data && this.data.length > 0) {
      const sampleRecord = this.data[0];
      const fieldNames = Object.keys(sampleRecord);
      
      // Caso 1: Búsqueda de coincidencia exacta
      if (fieldNames.includes(filterType)) {
        return filterType;
      }
      
      // Caso 2: Búsqueda de coincidencia por contener el texto (case insensitive)
      // Priorizamos nombres de campo únicos para cada tipo de filtro
      // para evitar coincidencias ambiguas
      
      // Prioridad 1: Campos que contienen exactamente el tipo de filtro
      const exactMatch = fieldNames.find(field => 
        field.toLowerCase() === filterType.toLowerCase()
      );
      
      if (exactMatch) {
        return exactMatch;
      }
      
      // Prioridad 2: Campos que contienen el tipo de filtro como substring
      const containsMatch = fieldNames.find(field => 
        field.toLowerCase().includes(filterType.toLowerCase())
      );
      
      if (containsMatch) {
        return containsMatch;
      }
      
      // Prioridad 3: Tipo de filtro contiene el nombre del campo
      const reverseMatch = fieldNames.find(field => 
        filterType.toLowerCase().includes(field.toLowerCase()) && 
        field.length > 2 // Evitar coincidencias con campos muy cortos
      );
      
      if (reverseMatch) {
        return reverseMatch;
      }
    }
    
    // Si no encontramos coincidencia, devolvemos el tipo de filtro tal cual
    // y agregamos un identificador único basado en el tipo para evitar colisiones
    return `${filterType}_field`;
  }
  
  /**
   * Devuelve un nombre amigable para el tipo de filtro
   * @param filterType Tipo de filtro
   * @returns Nombre para mostrar del filtro
   */
  private getFilterDisplayName(filterType: string): string {
    // Implementación genérica para convertir cualquier texto a un formato de título
    return filterType
      // Separar por guiones bajos o guiones
      .replace(/[-_]/g, ' ')
      // Separar camelCase (insertar espacio antes de mayúsculas)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Capitalizar primera letra de cada palabra
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  
  /**
   * Método utilitario para obtener las claves de un objeto
   * Usado en la plantilla HTML para iterar sobre objetos
   * @param obj Objeto del cual obtener las claves
   * @returns Array con las claves del objeto
   */
  getObjectKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
  
  /**
   * Obtiene un color para un gráfico basado en el índice
   * @param index Índice para el color
   * @returns Color en formato hexadecimal o rgba
   */
  getChartColor(index: number): string {
    // Colores predefinidos para los gráficos
    const colors = [
      '#4285F4', // Azul Google
      '#EA4335', // Rojo Google
      '#FBBC05', // Amarillo Google
      '#34A853', // Verde Google
      '#673AB7', // Morado
      '#FF9800', // Naranja
      '#795548', // Marrón
      '#009688', // Verde azulado
      '#00BCD4', // Cian
      '#E91E63', // Rosa
      '#3F51B5', // Índigo
      '#607D8B'  // Gris azulado
    ];
    
    // Si el índice es mayor que la cantidad de colores, generamos uno aleatorio
    if (index >= colors.length) {
      const r = Math.floor(128 + Math.random() * 128);
      const g = Math.floor(128 + Math.random() * 128);
      const b = Math.floor(128 + Math.random() * 128);
      return `rgba(${r}, ${g}, ${b}, 0.8)`;
    }
    
    return colors[index];
  }
  
  /**
   * Genera gráficos dinámicos basados en los filtros activos
   * Ahora envía los datos completos a cada instancia de dynamic-chart
   * y cada componente se encarga de hacer su propio filtrado
   */
  private generarGraficosDinamicos(): void {
    // console.log('MetricsDataComponent - generarGraficosDinamicos - inicio', {
    //   dataLength: this.data.length,
    //   activeFilters: this.activeFilters,
    //   filterKeys: Object.keys(this.activeFilters || {})
    // });
    
    // Si no hay filtros activos o datos, no generamos gráficos
    // if (this._hierarchicalFilters.length > 0 || !this.activeFilters || Object.keys(this.activeFilters).length === 0 || !this.data || this.data.length === 0) {
    //   // console.log('MetricsDataComponent - No hay filtros activos o datos para generar gráficos');
    //   this.dynamicCharts = [];
    //   return;
    // }
    
    // Limpiamos los gráficos dinámicos previos
    this.dynamicCharts = [];
    
    // Para cada tipo de filtro activo
    for (const filterType of Object.keys(this.activeFilters)) {
      const selectedValues = this.activeFilters[filterType] || [];
      
      // Solo procesamos si hay valores seleccionados
      if (selectedValues && selectedValues.length > 0) {
        // Obtener el nombre real del campo en los datos
        const fieldName = this.getFieldNameFromFilterType(filterType);
        
        // Ya no necesitamos filtrar los datos aquí, solo pasar la configuración
        // para que el componente dynamic-chart haga el filtrado
        
        // console.log('MetricsDataComponent - Configurando filtro para dynamic-chart:', {
        //   filterType, 
        //   fieldName,
        //   selectedValues: selectedValues.length
        // });
        
      }
    }
  }
  
  /**
   * Extrae las iniciales del nombre (máximo 2 caracteres)
   * @param name Nombre completo
   * @returns Iniciales del nombre
   */
  getInitials(name: string): string {
    if (!name) return '??';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '??';
    
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
  
  /**
   * Inicializa los gráficos después de que los elementos del DOM estén disponibles
   */
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 0);
  }
  
  /**
   * Inicializa los gráficos si hay datos
   */
  private initCharts(): void {
    if (this.getObjectKeys(this.registrosPorEstado).length > 0) {
      this.initEstadosChart();
    }
    
    if (this.getObjectKeys(this.registrosPorTipo).length > 0) {
      this.initTiposChart();
    }
  }
  
  /**
   * Actualiza los gráficos destruyendo los existentes y creando nuevos
   */
  private updateCharts(): void {
    // Destruimos los gráficos existentes si existen
    if (this.estadosChart) {
      this.estadosChart.destroy();
      this.estadosChart = null;
    }
    
    if (this.tiposChart) {
      this.tiposChart.destroy();
      this.tiposChart = null;
    }
    
    // Si ya tenemos los elementos del DOM, inicializamos los gráficos
    if (this.estadosChartCanvas && this.tiposChartCanvas) {
      this.initCharts();
    }
  }
  
  /**
   * Inicializa el gráfico de estados
   */
  private initEstadosChart(): void {
    if (!this.estadosChartCanvas) return;
    
    const ctx = this.estadosChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const labels = this.getObjectKeys(this.registrosPorEstado);
    const data = labels.map(key => this.registrosPorEstado[key]);
    const colors = labels.map((_, i) => this.getChartColor(i));
    
    this.estadosChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          hoverBackgroundColor: colors.map(color => this.adjustAlpha(color, 0.8)),
          borderWidth: 0,
          borderColor: 'transparent'
        }]
      },
      options: this.getChartOptions()
    });
  }
  
  /**
   * Inicializa el gráfico de tipos
   */
  private initTiposChart(): void {
    if (!this.tiposChartCanvas) return;
    
    const ctx = this.tiposChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const labels = this.getObjectKeys(this.registrosPorTipo);
    const data = labels.map(key => this.registrosPorTipo[key]);
    const colors = labels.map((_, i) => this.getChartColor(i + 3)); // Offset para usar colores diferentes
    
    this.tiposChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          hoverBackgroundColor: colors.map(color => this.adjustAlpha(color, 0.8)),
          borderWidth: 0,
          borderColor: 'transparent'
        }]
      },
      options: this.getChartOptions()
    });
  }
  
  /**
   * Ajusta la transparencia de un color
   * @param color Color en formato hexadecimal
   * @param alpha Nivel de transparencia (0-1)
   * @returns Color en formato rgba
   */
  private adjustAlpha(color: string, alpha: number): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  /**
   * Retorna configuraciones comunes para los gráficos
   * @returns Opciones de configuración para Chart.js
   */
  private getChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          display: false // Ocultamos la leyenda, ya que mostramos los valores en las listas
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 8,
          displayColors: true,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    };
  }

  /**
   * Alterna el modo de exportación masiva
   */
  toggleExportMode(): void {
    this.exportMode = !this.exportMode;
    if (!this.exportMode) {
      this.selectedForExport.clear();
    }
  }
  
  /**
   * Alterna la selección de un elemento para exportación
   * @param elementId ID del elemento a seleccionar/deseleccionar
   */
  toggleElementSelection(elementId: string): void {
    if (this.selectedForExport.has(elementId)) {
      this.selectedForExport.delete(elementId);
    } else {
      this.selectedForExport.add(elementId);
    }
  }
  
  /**
   * Verifica si un elemento está seleccionado para exportación
   * @param elementId ID del elemento
   * @returns true si está seleccionado
   */
  isElementSelected(elementId: string): boolean {
    return this.selectedForExport.has(elementId);
  }
  
  /**
   * Obtiene la lista de elementos seleccionados para exportación
   * @returns Array con los IDs de los elementos seleccionados
   */
  getSelectedElements(): string[] {
    return Array.from(this.selectedForExport);
  }
  
  /**
   * Limpia la selección de elementos para exportación
   */
  clearSelection(): void {
    this.selectedForExport.clear();
  }
  
  /**
   * Obtiene el nombre descriptivo de un elemento
   * @param elementId ID del elemento
   * @returns Nombre descriptivo del elemento
   */
  getElementName(elementId: string): string {
    if (elementId === 'summary-kpi') {
      return 'Resumen KPI - Datos Globales';
    }
    
    if (elementId.startsWith('dynamic-chart-')) {
      const index = parseInt(elementId.replace('dynamic-chart-', ''));
      const chart = this.dynamicCharts[index];
      return chart ? `Gráfico Dinámico - ${chart.filterType}` : 'Gráfico Dinámico';
    }
    
    return elementId;
  }
  
  /**
   * Obtiene el icono correspondiente a un elemento
   * @param elementId ID del elemento
   * @returns Nombre del icono de Material
   */
  getElementIcon(elementId: string): string {
    if (elementId === 'summary-kpi') {
      return 'dashboard';
    }
    
    if (elementId.startsWith('dynamic-chart-')) {
      return 'bar_chart';
    }
    
    return 'insert_drive_file';
  }
}
