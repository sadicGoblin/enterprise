import { Component, Input, OnChanges, OnDestroy, AfterViewInit, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration, ChartDataset } from 'chart.js';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dynamic-chart',
  templateUrl: './dynamic-chart.component.html',
  styleUrls: ['./dynamic-chart.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ]
})
export class DynamicChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() filterType: string = '';
  @Input() filterValue: string = '';
  @Input() filteredData: any[] = [];
  @Input() fieldToFilter: string = '';
  @Input() selectedValues: string[] = []; // Array de valores seleccionados para comparación
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Instancia del gráfico
  chart: Chart | null = null;
  
  // Estado de los datos
  hasData: boolean = false;
  
  // Valor KPI (porcentaje de cumplimiento)
  kpiValue?: number;
  
  // Clase CSS para el KPI
  kpiClass: string = 'kpi-warning';
  
  // Colores para los gráficos - similar a los mostrados en la imagen
  chartColors: string[] = [
    // Azul claro para "no cumplida" y rojo para "cumplida" como se ve en la imagen
    '#5B9BD5', '#ED7D31', '#70AD47', '#FFC000', '#7030A0',
    '#C00000', '#43682B', '#255E91', '#9E480E', '#636363',
    '#997300', '#A5A5A5', '#4472C4', '#FF3300', '#33CCCC'
  ];
  
  // Datos procesados del gráfico
  estados: string[] = [];
  valoresFiltro: string[] = [];
  estadosPorValor: Record<string, Record<string, number>> = {};
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['filteredData'] || changes['fieldToFilter'] || changes['selectedValues']) 
        && this.filteredData && this.filteredData.length > 0) {
      this.procesarDatos();
      this.kpiValue = this.calcularPorcentajeGeneralDeCumplimiento();
      this.kpiClass = this.getKpiClass();
      
      if (this.chart) {
        this.chart.destroy();
      }
      
      // Si ya tenemos el elemento canvas, inicializamos el gráfico
      if (this.chartCanvas) {
        this.initChart();
      }
    }
  }
  
  ngAfterViewInit(): void {
    if (this.filteredData && this.filteredData.length > 0) {
      this.initChart();
    }
  }
  
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
  
  /**
   * Procesa los datos filtrados para generar la información necesaria para el gráfico
   */
  procesarDatos(): void {
    this.hasData = this.filteredData.length > 0;
    if (!this.hasData) return;
    
    console.log('Procesando datos para el gráfico dinámico');
    console.log('Datos filtrados:', this.filteredData);
    
    // Detectar el campo de filtrado (puede venir como 'Obra', 'obra', etc.)
    const campoFiltro = this.fieldToFilter.toLowerCase();
    console.log('Campo filtro:', campoFiltro);
    
    // Detectar estados únicos en los datos (ejm: completado, pendiente, etc.)
    const todosLosEstados = new Set<string>();
    this.filteredData.forEach(item => {
      if (item.estado) {
        todosLosEstados.add(item.estado);
      }
    });
    this.estados = Array.from(todosLosEstados);
    console.log('Estados detectados:', this.estados);
    
    // Preparar estructura para contar estados por cada valor del filtro
    this.estadosPorValor = {};
    this.valoresFiltro = [...this.selectedValues];
    
    // Para cada valor seleccionado, contar ocurrencias de cada estado
    this.valoresFiltro.forEach(valor => {
      this.estadosPorValor[valor] = {};
      this.estados.forEach(estado => {
        this.estadosPorValor[valor][estado] = 0;
      });
      
      // Contar las ocurrencias de cada estado para este valor
      this.filteredData.forEach(item => {
        const itemValor = String(this.getCampoValor(item, campoFiltro)).toLowerCase();
        if (itemValor === valor.toLowerCase() && item.estado) {
          this.estadosPorValor[valor][item.estado]++;
        }
      });
    });
    
    console.log('Estadísticas por valor:', this.estadosPorValor);
  }
  
  /**
   * Obtiene el valor de un campo en un objeto, sin importar si está en mayúsculas/minúsculas
   */
  private getCampoValor(item: any, campo: string): string {
    // Buscar el campo sin importar mayúsculas/minúsculas
    const campoEncontrado = Object.keys(item).find(key => key.toLowerCase() === campo);
    return campoEncontrado ? item[campoEncontrado] : '';
  }
  
  /**
   * Inicializa el gráfico con los datos procesados
   */
  initChart(): void {
    if (!this.chartCanvas || !this.hasData) return;
    
    console.log('Inicializando gráfico');
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Preparar datasets para cada estado
    const datasets: ChartDataset[] = [];
    this.estados.forEach((estado, index) => {
      const data = this.valoresFiltro.map(valor => this.estadosPorValor[valor][estado] || 0);
      
      const colorIndex = index % this.chartColors.length;
      const color = this.chartColors[colorIndex];
      
      datasets.push({
        label: estado,
        data: data,
        backgroundColor: this.adjustAlpha(color, 0.7),
        borderColor: color,
        borderWidth: 1,
        barThickness: 10, // Establece una altura fija de 10px para todas las barras
        maxBarThickness: 25, // Limita el grosor máximo de las barras
        barPercentage: 0.8,
        categoryPercentage: 0.9
      });
    });
    
    // Configuración del gráfico
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.valoresFiltro,
        datasets: datasets
      },
      options: this.getChartOptions()
    };
    
    this.chart = new Chart(ctx, config);
    console.log('Gráfico creado', this.chart);
  }
  
  /**
   * Define las opciones de configuración del gráfico
   */
  private getChartOptions(): ChartConfiguration['options'] {
    return {
      indexAxis: 'y', // Para que las barras sean horizontales
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400
      },
      plugins: {
        legend: {
          display: false // Ocultamos la leyenda ya que tenemos una personalizada
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.x || 0;
              return `${label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: { // Eje horizontal: valores numéricos
          stacked: true, // Para barras apiladas
          grid: {
            display: true,
            color: 'rgba(255, 255, 255, 0.1)',
            tickLength: 0
          },
          border: {
            display: false
          },
          ticks: {
            font: {
              size: 10
            },
            color: '#b4b4cc',
            padding: 3,
            maxRotation: 0
          }
        },
        y: { // Eje vertical: categorías (valores del filtro)
          stacked: true,
          grid: {
            display: false
          },
          border: {
            display: false
          },
          position: 'left', // Asegura que las etiquetas estén a la izquierda
          ticks: {
            font: {
              size: 10,
              family: "Arial, sans-serif"
            },
            color: '#b4b4cc',
            padding: 5,
            autoSkip: false, // Asegura que todas las etiquetas sean visibles
            align: 'start', // Alinea las etiquetas a la izquierda para mejor legibilidad
            callback: (value, index) => {
              // Truncamos etiquetas muy largas
              const label = this.valoresFiltro[index] || '';
              return this.truncateLabel(label, 18);
            }
          }
        }
      }
    };
  }
  
  /**
   * Ajusta la transparencia de un color
   * @param color Color en formato hex, rgba o rgb
   * @param alpha Valor de transparencia (0-1)
   * @returns Color con transparencia ajustada en formato rgba
   */
  public adjustAlpha(color: string, alpha: number): string {
    let r = 0, g = 0, b = 0;
    
    if (color.startsWith('rgba(')) {
      const match = color.match(/rgba\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*[\\d.]+\\s*\\)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    
    if (color.startsWith('#')) {
      // #RGB o #RGBA
      if (color.length === 4 || color.length === 5) {
        r = parseInt(color.charAt(1) + color.charAt(1), 16);
        g = parseInt(color.charAt(2) + color.charAt(2), 16);
        b = parseInt(color.charAt(3) + color.charAt(3), 16);
      } 
      // #RRGGBB o #RRGGBBAA
      else if (color.length === 7 || color.length === 9) {
        r = parseInt(color.substring(1, 3), 16);
        g = parseInt(color.substring(3, 5), 16);
        b = parseInt(color.substring(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    if (color.startsWith('rgb(')) {
      const match = color.match(/rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    
    // Si no se puede parsear, devolvemos el color original
    return color;
  }
  
  /**
   * Método para obtener un nombre amigable para el filtro actual
   */
  public getFilterDisplayName(): string {
    // Convertir el nombre del filtro a un formato más amigable para mostrar
    if (!this.fieldToFilter) return 'Filtro';
    
    // Separar palabras por mayúsculas y capitalizar cada una
    const fieldName = this.fieldToFilter
      .replace(/([A-Z])/g, ' $1') // Inserta espacio antes de cada mayúscula
      .replace(/^./, str => str.toUpperCase()) // Capitaliza la primera letra
      .trim(); // Elimina espacios extras
    
    return fieldName;
  }
  
  /**
   * Calcula el porcentaje general de cumplimiento (KPI)
   * @returns Porcentaje de 0 a 100
   */
  private calcularPorcentajeGeneralDeCumplimiento(): number {
    // Por defecto mostramos un valor neutro (50%)
    // Esta función debe ser personalizada según los criterios específicos de negocio
    // Importante: No asumimos la semántica de los estados (qué es 'completado', 'pendiente', etc.),
    // ya que estamos construyendo un componente completamente dinámico sin hardcodeos
    return 50;
  }
  
  /**
   * Método público para obtener el valor KPI que se muestra en el template
   */
  public getKpiValue(): number {
    return this.calcularPorcentajeGeneralDeCumplimiento();
  }
  
  /**
   * Determina la clase CSS del KPI basado en el porcentaje
   */
  public getKpiClass(): string {
    const kpiValue = this.getKpiValue();
    
    if (kpiValue >= 75) {
      return 'kpi-success';
    } else if (kpiValue >= 50) {
      return 'kpi-warning';
    } else {
      return 'kpi-danger';
    }
  }
  
  /**
   * Trunca una etiqueta si es demasiado larga
   */
  private truncateLabel(label: string, maxLength: number): string {
    return label.length > maxLength
      ? `${label.substring(0, maxLength)}...`
      : label;
  }
}
