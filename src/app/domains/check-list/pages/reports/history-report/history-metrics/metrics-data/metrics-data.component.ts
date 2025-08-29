import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicChartComponent } from './dynamic-chart/dynamic-chart.component';
import { SummaryKpiComponent } from './summary-kpi/summary-kpi.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-metrics-data',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatCardModule, 
    MatDividerModule, 
    MatTooltipModule,
    DynamicChartComponent,
    SummaryKpiComponent
  ],
  templateUrl: './metrics-data.component.html',
  styleUrls: ['./metrics-data.component.scss']
})
export class MetricsDataComponent implements OnChanges, AfterViewInit {
  @Input() data: any[] = [];
  @Input() activeFilters: {[key: string]: string[]} = {};
  
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
  
  // Gráficos dinámicos por filtros activos
  dynamicCharts: {filterType: string, fieldName: string, selectedValues?: string[]}[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    console.log('MetricsDataComponent - ngOnChanges:', { 
      data: changes['data']?.currentValue?.length || 0, 
      activeFilters: changes['activeFilters']?.currentValue, 
      hasFilters: changes['activeFilters'] && Object.keys(changes['activeFilters'].currentValue || {}).length > 0
    });
    if ((changes['data'] && this.data) || changes['activeFilters']) {
      this.procesarDatos();
    }
  }
  
  /**
   * Procesa los datos para generar métricas y gráficos
   */
  procesarDatos(): void {
    console.log('MetricsDataComponent - procesarDatos - inicio', {
      dataLength: this.data.length, 
      activeFilters: this.activeFilters,
      hasActiveFilters: Object.keys(this.activeFilters || {}).length > 0
    });
    
    // Reiniciar contadores
    this.totalRegistros = this.data.length;
    this.registrosPorTipo = {};
    this.registrosPorEstado = {};
    this.registrosPorObra = {};
    this.registrosPorUsuario = {};
    
    // Procesar cada registro
    this.data.forEach((registro: any) => {
      // Contar por tipo
      if (registro.tipo) {
        this.registrosPorTipo[registro.tipo] = (this.registrosPorTipo[registro.tipo] || 0) + 1;
      }
      
      // Contar por estado
      if (registro.estado) {
        this.registrosPorEstado[registro.estado] = (this.registrosPorEstado[registro.estado] || 0) + 1;
      }
      
      // Contar por obra
      if (registro.obra) {
        this.registrosPorObra[registro.obra] = (this.registrosPorObra[registro.obra] || 0) + 1;
      }
      
      // Contar por usuario
      if (registro.usuario) {
        this.registrosPorUsuario[registro.usuario] = (this.registrosPorUsuario[registro.usuario] || 0) + 1;
      }
    });
    
    // Generar gráficos dinámicos basados en filtros activos
    this.generarGraficosDinamicos();
  }
  
  /**
   * Convierte el tipo de filtro a un nombre de campo en los datos
   * @param filterType Tipo de filtro
   * @returns Nombre del campo correspondiente
   */
  private getFieldNameFromFilterType(filterType: string): string {
    // Mapeo de tipos de filtro a nombres de campo
    const filterMap: {[key: string]: string} = {
      'tipo': 'tipo',
      'estado': 'estado',
      'obra': 'obra',
      'usuario': 'usuario'
      // Agregar más mapeos según sea necesario
    };
    
    return filterMap[filterType] || filterType;
  }
  
  /**
   * Devuelve un nombre amigable para el tipo de filtro
   * @param filterType Tipo de filtro
   * @returns Nombre para mostrar del filtro
   */
  private getFilterDisplayName(filterType: string): string {
    // Mapeo de tipos de filtro a nombres para mostrar
    const displayMap: {[key: string]: string} = {
      'tipo': 'Tipo',
      'estado': 'Estado',
      'obra': 'Obra',
      'usuario': 'Usuario'
      // Agregar más mapeos según sea necesario
    };
    
    return displayMap[filterType] || filterType.charAt(0).toUpperCase() + filterType.slice(1);
  }
  
  /**
   * Genera gráficos dinámicos basados en los filtros activos
   */
  private generarGraficosDinamicos(): void {
    console.log('MetricsDataComponent - generarGraficosDinamicos - inicio', {
      dataLength: this.data.length,
      activeFilters: this.activeFilters,
      filterKeys: Object.keys(this.activeFilters || {})
    });
    
    // Si no hay filtros activos o datos, no generamos gráficos
    if (!this.activeFilters || Object.keys(this.activeFilters).length === 0 || !this.data || this.data.length === 0) {
      console.log('MetricsDataComponent - No hay filtros activos o datos para generar gráficos');
      this.dynamicCharts = [];
      return;
    }
    
    // Limpiamos los gráficos dinámicos previos
    this.dynamicCharts = [];
    
    // Para cada tipo de filtro activo
    for (const filterType of Object.keys(this.activeFilters)) {
      const selectedValues = this.activeFilters[filterType] || [];
      
      // Solo procesamos si hay valores seleccionados
      if (selectedValues && selectedValues.length > 0) {
        // Obtener el nombre real del campo en los datos
        const fieldName = this.getFieldNameFromFilterType(filterType);
        
        // Para cada valor seleccionado en el filtro actual, verificar si hay datos
        const valoresConDatos = selectedValues.filter(filterValue => {
          // Buscar registros que coincidan con el valor del filtro
          const registrosCoincidentes = this.data.filter((registro: any) => {
            // Si el tipo de filtro coincide exactamente con un campo en los datos
            if (registro[fieldName] !== undefined) {
              return registro[fieldName] === filterValue;
            }
            
            // Si no coincide exactamente, buscamos un campo que contenga el nombre del filtro
            const camposRegistro = Object.keys(registro);
            const campoCoincidente = camposRegistro.find(campo => 
              campo.toLowerCase().includes(fieldName.toLowerCase())
            );
            
            // Si encontramos el campo, comparamos su valor
            if (campoCoincidente) {
              return registro[campoCoincidente] === filterValue;
            }
            return false;
          });
          
          return registrosCoincidentes.length > 0;
        });
        
        console.log('MetricsDataComponent - Valores con datos para filtro:', {
          filterType, 
          fieldName,
          valoresConDatos,
          totalValores: valoresConDatos.length
        });
        
        if (valoresConDatos.length > 0) {
          // Agregar configuración para este filtro
          this.dynamicCharts.push({
            filterType: this.getFilterDisplayName(filterType),
            fieldName,
            selectedValues: valoresConDatos
          });
        } else {
          console.log('MetricsDataComponent - No existen datos para este filtro:', {
            filterType,
            fieldName
          });
        }
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
   * Método auxiliar para obtener las claves de un objeto
   * @param obj Objeto del que se extraerán las claves
   * @returns Array de claves del objeto
   */
  getObjectKeys(obj: {[key: string]: any}): string[] {
    return Object.keys(obj || {});
  }
  
  /**
   * Retorna un color para los gráficos basado en un índice
   * @param index Índice del color
   * @returns Color en formato hexadecimal
   */
  getChartColor(index: number): string {
    const colors = [
      '#4285F4', // Azul
      '#34A853', // Verde
      '#FBBC05', // Amarillo
      '#EA4335', // Rojo
      '#8E24AA', // Púrpura
      '#00ACC1', // Cyan
      '#FB8C00', // Naranja
      '#43A047', // Verde oscuro
      '#3949AB', // Indigo
      '#D81B60', // Rosa
      '#6D4C41', // Marrón
      '#757575', // Gris
    ];
    
    return colors[index % colors.length];
  }
}
