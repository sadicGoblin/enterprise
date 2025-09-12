import { Component, Input, OnChanges, OnDestroy, AfterViewInit, ElementRef, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Chart, ChartConfiguration, ChartDataset } from 'chart.js';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter as _filter, cloneDeep } from 'lodash';
import * as moment from 'moment-timezone';
// Configurar moment para usar español y zona horaria de Santiago de Chile
import 'moment/locale/es';

// Import report configuration model
import { ReportConfig } from '../../../models/report-config.model';
import { HierarchicalFilterItem } from '../../../../../../models/hierarchical-filter.model';

@Component({
  selector: 'app-dynamic-chart',
  templateUrl: './dynamic-chart.component.html',
  styleUrls: ['./dynamic-chart.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ]
})
export class DynamicChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  // Set moment locale and timezone
  private readonly TIMEZONE = 'America/Santiago';
  
  @Input() filterType: string = '';
  @Input() completeData: any[] = []; // Datos completos sin filtrar
  @Input() fieldToFilter: string = '';
  @Input() activeFilters: any = {}; // Filtros activos (igual que summary-kpi)
  @Input() hierarchicalFilters: HierarchicalFilterItem[] = [];
  @Input() reportConfig?: ReportConfig; // Configuración del reporte
  
  // Data filtrada para mostrar en el popup de detalles
  filteredData: any[] = [];
  @Input() title: string = 'KPI OBRA'; // Título personalizable con valor predeterminado

  // Propiedades para la tabla mensual
  monthsInRange: string[] = [];
  monthlyTableData: any[] = [];
  yAxisLabel: string = ''; // Etiqueta para el eje vertical en la tabla

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Output() dataFilter = new EventEmitter<any>();

  // Instancia del gráfico
  chart: Chart | null = null;

  // Estado de los datos
  hasData: boolean = false;

  // Valor KPI (porcentaje de cumplimiento)
  kpiValue?: number;

  // Datos para el footer
  totalElementos: number = 0;
  totalFiltro: number = 0;
  contadorEstados: { [key: string]: number } = {};
  promediosPorEstado: { [key: string]: number } = {};

  // Clase CSS para el KPI
  kpiClass: string = 'kpi-warning';

  // Colores para los gráficos - similar a los mostrados en la imagen
  chartColors: string[] = [
    // Azul claro para "no cumplida" y rojo para "cumplida" como se ve en la imagen
    '#5B9BD5', '#ED7D31', '#70AD47', '#FFC000', '#7030A0',
    '#C00000', '#43682B', '#255E91', '#9E480E', '#636363',
    '#997300', '#A5A5A5', '#4472C4', '#FF3300', '#33CCCC'
  ];

  // Campo principal que se usará para procesar los datos (antes era hardcodeado 'estado')
  principalValueField: string = 'estado';

  // Estados únicos encontrados (usado para barras, leyendas y estadísticas)
  estados: string[] = [];
  valoresFiltro: string[] = [];
  estadosPorValor: Record<string, Record<string, number>> = {};
  
  // Constructor para inyectar servicios necesarios
  constructor(private dialog: MatDialog) { 
    // Configure moment to use Spanish locale and Santiago timezone
    moment.locale('es');
    moment.tz.setDefault(this.TIMEZONE);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // // console.log('Cambiando cambios', this.fieldToFilter.toLowerCase(), changes);
    // Si cambia la configuración del reporte, actualizamos los campos a utilizar
    if (changes['reportConfig'] && this.reportConfig) {
      // Actualizamos el campo principal desde la configuración
      this.principalValueField = this.reportConfig.principalValue;
    }

    if (changes['hierarchicalFilters'] && this.hierarchicalFilters.length > 0) {
      //// console.log('[DynamicChartComponent] - ngOnChanges - handleHierarchicalFiltersChange:', this.hierarchicalFilters);
    }

    if (changes['completeData']
      && this.completeData && this.completeData.length > 0) {
      this.procesarDatos();
    }
  }

  ngAfterViewInit(): void {
    if (this.completeData && this.completeData.length > 0) {
      this.initChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }


  processFilterHierarchical(rawData: any[] = []) {
      //// console.log('dynamicChartComponent - processFilterHierarchical', this.filterType, this.hierarchicalFilters);
      let rawDataFiltered: any[] = []; 
      rawDataFiltered = [...rawData];
      this.filteredData = []; // Reset filtered data array
      if (this.hierarchicalFilters && this.hierarchicalFilters.length > 0) {
        // Start with a copy of all raw data
        
        let rawDataResult: any[] = []; 
        
        //// console.log('rawDataFiltered', rawDataFiltered);
        
        // Sort filters by position to ensure proper hierarchy
        const sortedFilters = [...this.hierarchicalFilters].sort((a, b) => a.position - b.position);
        
        // Apply each filter in order using for...of to allow break statements
        for (const filter of sortedFilters) {
          if (filter.filters && filter.filters.length > 0) {
            //// console.log('filter', filter);
            const filterType = filter.filterType;
            const filters = filter.filters;
            const position = filter.position;
            //// console.log('filterType', filterType, this.filterType);
            
            
  
            //// console.log('Applying filter:', filterType, 'with values:', filters);
            
            // Log sample data item to see structure
            if (rawDataFiltered.length > 0) {
              //// console.log('Sample data item:', rawDataFiltered[0]);
              //// console.log('Field value in sample:', filterType, '=', rawDataFiltered[0][filterType]);
            }
            
            // Apply the filter and store the result with case-insensitive comparison
            const filteredData = _filter(rawDataFiltered, item => {
              // Get the value of the item - using getCampoValor for case-insensitive field name matching
             
              const itemValue = this.getCampoValor(item, filterType);
              // Skip if value doesn't exist
              if (itemValue === null || itemValue === undefined) {
                //// console.log('Skipping item - missing field:', filterType);
                return false;
              }
              
              // Convert item value to lowercase string for comparison
              const normalizedItemValue = String(itemValue).toLowerCase();
              
              // Debug logging for some items
              const debugSample = Math.random() < 0.05; // Log ~5% of items
              if (debugSample) {
                //// console.log('Item value:', itemValue, 'normalized to:', normalizedItemValue);
                //// console.log('Filter values:', filters.map(f => String(f).toLowerCase()));
                
                // Check if any match exists
                const hasMatch = filters.some(filterValue => 
                  String(filterValue).toLowerCase() === normalizedItemValue
                );
                //// console.log('Match found?', hasMatch);
              }
              
              // Check if any filter value matches (case insensitive)
              return filters.some(filterValue => {
                const normalizedFilterValue = String(filterValue).toLowerCase();
                return normalizedFilterValue === normalizedItemValue;
              });
            });
            
            //// console.log(`Filter applied: ${filterType} - Items before: ${rawDataFiltered.length}, after: ${filteredData.length}`);

  
            // Store filtered data for processing
            rawDataFiltered = filteredData;
            // Save last filtered data for details popup
            this.filteredData = filteredData;
            // Stop all filtering if we hit the current field name to avoid circular filtering
            if(String(filterType) === String(this.filterType)){
              break; // Exit the loop completely
            }
          }
        }
  
        
  
        // this.rawData = rawDataFiltered;
        
        // Log the filtered results
        // // console.log('Raw data filtered by hierarchical filters:', this.filterField, this.rawData);
      } 
      // console.log('rawDataResult', this.filterType, rawDataFiltered);
      return rawDataFiltered;
    }

  /**
   * Procesa los datos completos aplicando filtros para generar la información necesaria para el gráfico
   */
  procesarDatos(): void {
    this.hasData = this.completeData.length > 0;
    if (!this.hasData) return;

    // // console.log('Procesando datos para el gráfico dinámico');
    // // console.log('Total datos disponibles:', this.completeData.length,
    //   'usando campo principal:', this.principalValueField);

    // Hacemos una copia profunda de los datos para evitar mutaciones no deseadas
    // const dataCopy = JSON.parse(JSON.stringify(this.completeData));
    const dataCopy = this.processFilterHierarchical(this.completeData);

    // Detectar el campo de filtrado (puede venir como 'Obra', 'obra', etc.)
    const campoFiltro = this.fieldToFilter.toLowerCase();
    
    // Configurar el nombre para el eje vertical de la tabla
    this.yAxisLabel = this.fieldToFilter;
    
    // Generar la tabla mensual
    this.generateMonthlyTable(dataCopy);

    // Filtramos los datos usando activeFilters, similar a summary-kpi
    const datosFiltrados = dataCopy.filter((item: any) => {
      // Verificamos cada filtro activo
      for (const filterField in this.activeFilters) {
        // // // console.log('Campo filtros:', campoFiltro, filterField);
        if(campoFiltro !== filterField.toLowerCase()) continue;
        if (this.activeFilters.hasOwnProperty(filterField) &&
          this.activeFilters[filterField] &&
          this.activeFilters[filterField].length > 0) {

          // Obtenemos el valor del item para este campo de filtro
          const itemValue = this.getCampoValor(item, filterField.toLowerCase());
          if (!itemValue) return false;

          // Si el valor del item no está en los filtros seleccionados, excluimos el item
          const strItemValue = String(itemValue).toLowerCase();
          if (!this.activeFilters[filterField].some((filterValue: string) =>
            String(filterValue).toLowerCase() === strItemValue)) {
            return false;
          }
        }
      }

      // Si pasó todos los filtros, incluimos el item
      return true;
    });

    // // console.log('Datos filtrados:', datosFiltrados.length);

    // Actualizamos el total de elementos para el footer
    this.totalElementos = datosFiltrados.length;

    // Este valor se actualizará más adelante cuando tengamos los valores únicos del filtro
    this.totalFiltro = 0;

    // Detectar estados únicos en los datos filtrados usando el campo principal
    const todosLosEstados = new Set<string>();

    // Reiniciamos los contadores para estadísticas
    this.contadorEstados = {};
    this.promediosPorEstado = {};

    // Contamos ocurrencias de cada estado
    datosFiltrados.forEach((item: any) => {
      if (item[this.principalValueField]) {
        const estado = item[this.principalValueField];
        todosLosEstados.add(estado);

        // Incrementamos el contador para este estado
        if (!this.contadorEstados[estado]) {
          this.contadorEstados[estado] = 0;
        }
        this.contadorEstados[estado]++;
      }
    });

    this.estados = Array.from(todosLosEstados);
    // // console.log('Estados detectados:', this.estados);
    // // console.log('Contadores por estado:', this.contadorEstados);

    // Obtener valores únicos del campo de filtro
    const valoresFiltracion = new Set<string>();
    datosFiltrados.forEach((item: any) => {
      const valorFiltro = this.getCampoValor(item, campoFiltro);
      if (valorFiltro) {
        valoresFiltracion.add(valorFiltro);
      }
    });
    this.valoresFiltro = Array.from(valoresFiltracion);

    // Actualizar totalFiltro con la cantidad real de barras que se mostrarán en el gráfico
    // (corresponde a la cantidad de valores únicos del campo de filtro)
    this.totalFiltro = this.valoresFiltro.length;

    // Inicializar el objeto para almacenar conteos por estado y valor de filtro
    this.estadosPorValor = {};
    this.valoresFiltro.forEach(valorFiltro => {
      this.estadosPorValor[valorFiltro] = {};
      this.estados.forEach(estado => {
        this.estadosPorValor[valorFiltro][estado] = 0;
      });
    });

    // Contar registros para cada combinación de estado y valor de filtro
    datosFiltrados.forEach((item: any) => {
      const valorFiltro = this.getCampoValor(item, campoFiltro);
      const estado = item[this.principalValueField]; // Usar el campo principal configurado
      if (valorFiltro && estado && this.estadosPorValor[valorFiltro]) {
        if (!this.estadosPorValor[valorFiltro][estado]) {
          this.estadosPorValor[valorFiltro][estado] = 0;
        }
        this.estadosPorValor[valorFiltro][estado]++;
      }
    });
    // // console.log('Estadísticas por valor:', this.estadosPorValor);
    
  }

  /**
   * Obtiene el valor de un campo en un objeto, sin importar si está en mayúsculas/minúsculas
   */
  private getCampoValor(item: any, campo: string): string {
    // Buscar el campo sin importar mayúsculas/minúsculas
    const campoEncontrado = Object.keys(item).find(key => key.toLowerCase() === campo.toLowerCase());
    // // console.log('Campo encontrado:', campoEncontrado, item, campo);
    return campoEncontrado ? item[campoEncontrado] : '';
  }

  /**
   * Inicializa el gráfico con los datos procesados
   */
  initChart(): void {
    if (!this.chartCanvas || !this.hasData) return;

    // // console.log('Inicializando gráfico');

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // // console.log('Inicializando gráfico dinámico');

    // Ajustamos la altura del canvas basado en la cantidad de elementos
    this.adjustCanvasHeight();

    // Crear datasets para el gráfico (uno por cada estado)
    const datasets: ChartDataset[] = [];

    // Para cada estado/valor, creamos un dataset
    this.estados.forEach((estado, index) => {
      const data = this.valoresFiltro.map(valor => this.estadosPorValor[valor][estado] || 0);

      datasets.push({
        label: estado,
        data: data,
        backgroundColor: this.getEstadoColor(estado, index),
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 0.5,
        borderRadius: 2,
        barPercentage: 0.9,
        categoryPercentage: 0.8,
        hoverBackgroundColor: this.adjustAlpha(this.getEstadoColor(estado, index), 0.8)
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

    // Crear nueva instancia de gráfico
    this.chart = new Chart(ctx, config);
    // // console.log('Gráfico creado', this.chart);
  }

  /**
   * Ajusta la altura del canvas basado en la cantidad de elementos
   * Para garantizar suficiente espacio entre las barras
   */
  private adjustCanvasHeight(): void {
    if (!this.valoresFiltro || this.valoresFiltro.length === 0) return;

    // Calculamos una altura dinámica basada en la cantidad de elementos
    // Aumentamos considerablemente la asignación de espacio vertical
    const baseHeight = 200; // Altura base más grande
    const itemCount = this.valoresFiltro.length;
    const minItemsForBase = 3; // Menos elementos antes de empezar a crecer
    const heightPerExtraItem = 10; // Más espacio por cada elemento adicional

    let calculatedHeight = baseHeight;
    if (itemCount > minItemsForBase) {
      calculatedHeight += (itemCount - minItemsForBase) * heightPerExtraItem;
    }

    // Sin límite máximo para permitir que crezca lo necesario

    // Aplicamos la altura calculada al canvas y a su contenedor padre
    const canvas = this.chartCanvas.nativeElement;
    canvas.height = calculatedHeight;
    canvas.style.height = `${calculatedHeight}px`;

    // También aplicamos la altura al contenedor padre para forzar el redimensionamiento
    const container = canvas.parentElement;
    if (container) {
      container.style.height = `${calculatedHeight}px`;
      container.style.minHeight = `${calculatedHeight}px`;
    }
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
        duration: 300
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
          // Aumentamos el espacio reservado para las etiquetas del eje Y
          afterFit: (axis) => {
            // Reservamos 100px más de espacio para las etiquetas
            axis.width = axis.width + 80;
          },
          ticks: {
            font: {
              size: 10,
              family: "Arial, sans-serif"
            },
            color: '#b4b4cc',
            padding: 6, // Aumentamos el padding de 5 a 8
            autoSkip: false, // Asegura que todas las etiquetas sean visibles
            align: 'start', // Alinea las etiquetas a la izquierda para mejor legibilidad
            callback: (value, index) => {
              // Truncamos etiquetas muy largas
              const label = this.valoresFiltro[index] || '';
              return this.truncateLabel(label, 25); // Permitir etiquetas más largas
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
      const match = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*[\d.]+\s*\)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    } else if (color.startsWith('rgb(')) {
      const match = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    } else if (color.startsWith('#')) {
      r = parseInt(color.substring(1, 3), 16);
      g = parseInt(color.substring(3, 5), 16);
      b = parseInt(color.substring(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Valor por defecto si no se puede procesar el color
    return `rgba(200, 200, 200, ${alpha})`;
  }

  /**
   * Obtiene el color correspondiente a un estado
   * @param estado Nombre del estado
   * @param index Índice alternativo para usar si no hay color configurado
   * @returns Color en formato hexadecimal 
  getEstadoColor(estado: string, index: number): string {
    // Colores por defecto para los estados
    if (!this.reportConfig || !this.reportConfig.estadosColors) {
      const defaultColors = ['#4CAF50', '#FFC107', '#F44336', '#2196F3'];
      return defaultColors[index % defaultColors.length];
    }
    
    // Usamos los colores configurados si están disponibles
    const colorMap = this.reportConfig.estadosColors;
    return colorMap[estado] || '#757575'; // Gris por defecto
  }
  
  /**
   * Returns a CSS class based on the numeric value to color the cell
   * @param value Numeric value (percentage or quantity)
   * @returns CSS class corresponding to the value range
   */
  getValueClass(value: number): string {
    if (value === undefined || value === null) return 'no-data';
    
    // Check if we're in quantity mode
    const isQuantityMode = this.reportConfig?.unit === 'quantity';
    
    if (isQuantityMode) {
      // For quantity mode: any value >= 1 is excellent (green)
      return value >= 1 ? 'excellent' : 'poor';
    } else {
      // For percentage mode: use the existing thresholds
      if (value >= 95) return 'excellent';
      if (value >= 70) return 'good';
      if (value >= 50) return 'average';
      return 'poor';
    }
  }
  
  /**
   * Obtiene el color correspondiente a un estado para mostrar en los contadores
   * @param estado Nombre del estado
   * @param index Índice alternativo para usar si no hay color configurado
   * @returns Color en formato hexadecimal
   */
  getEstadoColor(estado: string, index: number): string {
    // Primero buscamos en la configuración de colores del reporte
    if (this.reportConfig?.chartColors) {
      const colorConfig = this.reportConfig.chartColors.find(cc => cc.indexItem === estado);
      if (colorConfig) {
        return colorConfig.color;
      }
    }

    // Si no hay configuración específica, usamos el color del array por defecto
    return this.chartColors[index % this.chartColors.length];
  }

  // Se ha eliminado el método getEstadoClass ya que ahora usamos getEstadoColor directamente
  
  /**
   * Generates the monthly data table based on filtered data
   * @param data Filtered data to process
   */
  generateMonthlyTable(data: any[]): void {
    // Reset data if input is empty
    if (!data || data.length === 0) {
      this.monthsInRange = [];
      this.monthlyTableData = [];
      return;
    }
    
    // Get field names from configuration or use defaults
    const dateField = 'fecha';
    const stateField = this.principalValueField || 'estado';
    const categoryField = this.fieldToFilter;
    
    // Get values from configuration
    const positiveValue = this.reportConfig?.principalValuePositive || 'cumplida';
    const unit = this.reportConfig?.unit || 'percent'; // Default to percent if not specified
    
    // Determine calculation mode (percent vs quantity)
    const isPercentMode = unit === 'percent';
    
    // console.log('Table configuration:', { 
    //   dateField, 
    //   stateField, 
    //   categoryField,
    //   positiveValue,
    //   unit,
    //   isPercentMode
    // });
    
    // Extract all months from data
    const months = new Set<string>();
    
    // Structure to store category > month > state > count
    interface CategoryData {
      [month: string]: {
        states: { [state: string]: number },
        totalItems: number
      }
    }
    
    // Main data store
    const categoriesData: { [category: string]: CategoryData } = {};
    
    // Imprimir los primeros 5 elementos de datos para verificar fechas
    // console.log('Primeros 5 datos recibidos:');
    data.slice(0, 5).forEach(item => {
      // console.log('#DATE Fecha original:', item[dateField], 'Tipo:', typeof item[dateField]);
    });
    
    // Define un tipo para los registros por mes
    interface DateRecord {
      original: string;
      parsed: string;
      month: number;
      year: number;
      category: string;
      state: string;
    }
    
    // Arrays para recolectar registros de julio y agosto para análisis
    const julyRecords: DateRecord[] = [];
    const augustRecords: DateRecord[] = [];
    
    // Process all data items
    data.forEach(item => {
      // Skip items without date
      if (!item[dateField]) return;
      
      try {
        // Convert date to month-year format using moment
        const originalDate = item[dateField];
        // Crear objeto moment con la fecha original y la zona horaria configurada
        const momentDate = moment.tz(originalDate, this.TIMEZONE);
        
        // Verificar si la fecha es válida
        if (!momentDate.isValid()) {
          // console.warn('#DATE Formato de fecha originalDate:', originalDate);
          return; // Skip this item
        }

        // console.warn('#DATE Formato de fecha momentDate:', momentDate);
        
        // Obtener mes y año con moment (más confiable que Date)
        const monthNumber = momentDate.month() + 1; // moment es 0-indexado para meses
        const year = momentDate.year();
        const yearShort = year.toString().substr(2);
        
        // Usar el nombre abreviado del mes en español en lugar del número
        const monthName = momentDate.format('MMM'); // Devuelve 'ene', 'feb', etc.
        const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1); // 'Ene', 'Feb'
        const month = `${monthNameCapitalized} ${yearShort}`;
        
        // Guardar información de fechas por mes para diagnóstico
        const recordInfo: DateRecord = {
          original: String(originalDate),
          parsed: momentDate.toISOString(),
          month: monthNumber,
          year: momentDate.year(),
          category: String(item[categoryField] || 'N/A'),
          state: String(item[stateField] || 'N/A')
        };
        
        months.add(month);
        
        // Get category value (using field to filter by)
        const category = String(item[categoryField] || '');
        if (!category) return;
        
        // Get state value (using principal value field)
        const state = String(item[stateField] || '');
        if (!state) return;
        
        // Initialize category if needed
        if (!categoriesData[category]) {
          categoriesData[category] = {};
        }
        
        // Initialize month for this category if needed
        if (!categoriesData[category][month]) {
          categoriesData[category][month] = {
            states: {},
            totalItems: 0
          };
        }
        
        // Update state count
        const monthData = categoriesData[category][month];
        monthData.states[state] = (monthData.states[state] || 0) + 1;
        monthData.totalItems++;
      } catch (e) {
        console.error('Error processing date:', item[dateField], e);
      }
    });
    
    // console.log('#DATE months:', months);
    // Sort months chronologically using moment - updated for text month format
    this.monthsInRange = Array.from(months).sort((a, b) => {
      // Extract month name and year from format "Ene 25"
      const monthNameA = a.split(' ')[0]; // "Ene", "Feb", etc.
      const yearA = a.split(' ')[1];      // "25"
      const monthNameB = b.split(' ')[0];
      const yearB = b.split(' ')[1];
      
      // Create dates using the month name and year
      let dateA, dateB;
      
      try {
        // Create dates using the Spanish month names
        if (yearA && monthNameA) {
          // Parse Spanish month names in the same locale
          dateA = moment.tz(`01-${monthNameA}-20${yearA}`, 'DD-MMM-YYYY', 'es', this.TIMEZONE);
        } else {
          dateA = moment.tz('2000-01-01', this.TIMEZONE);
        }
        
        if (yearB && monthNameB) {
          dateB = moment.tz(`01-${monthNameB}-20${yearB}`, 'DD-MMM-YYYY', 'es', this.TIMEZONE);
        } else {
          dateB = moment.tz('2000-01-01', this.TIMEZONE);
        }
        
        // Verify that the dates are valid
        if (!dateA.isValid()) {
          console.warn('Invalid date A:', a, dateA);
          dateA = moment.tz('2000-01-01', this.TIMEZONE);
        }
        if (!dateB.isValid()) {
          console.warn('Invalid date B:', b, dateB);
          dateB = moment.tz('2000-01-01', this.TIMEZONE);
        }
      } catch (e) {
        console.error('Error sorting dates:', e, { a, b, monthNameA, yearA, monthNameB, yearB });
        dateA = moment.tz('2000-01-01', this.TIMEZONE);
        dateB = moment.tz('2000-01-01', this.TIMEZONE);
      }
      
      // Comparar usando la función unix() que es más rápida que valueOf()
      return dateA.unix() - dateB.unix();
    });

    
    // console.log('#DATE Detected months:', this.monthsInRange);
    
    // Generate table data
    // console.log('#DATE categoriesData:', categoriesData);
    this.monthlyTableData = Object.entries(categoriesData).map(([category, categoryData]) => {
      // Create row with category name
      const rowData: any = { name: category, isTotal: false }; // Flag to identify normal rows
      let totalSum = 0;
      let monthCount = 0;
      
      // Process each month
      this.monthsInRange.forEach(month => {
        const monthInfo = categoryData[month];
        if (monthInfo && monthInfo.totalItems > 0) {
          // Get state counts for this month
          const stateValues = monthInfo.states;
          const totalItems = monthInfo.totalItems;
          // console.log('#DATE stateValues:', stateValues);
          // console.log('#DATE totalItems:', totalItems);
          
          //// console.log(`States for ${category} in ${month}:`, stateValues);
          
          // Find positive states (matching the configured value)
          let positiveStates = Object.keys(stateValues).filter(state => 
            state.toLowerCase() === positiveValue.toLowerCase()
          );
          
          // Sum up all positive state counts
          const positiveCount = positiveStates.reduce((sum, state) => 
            sum + (stateValues[state] || 0), 0
          );
          
          // Calculate value based on unit type (percent or quantity)
          let cellValue;
          
          if (isPercentMode) {
            // Calculate percentage of positive states (for percent mode)
            const percentValue = Math.round((positiveCount / totalItems) * 100);
            
            // Store both the percentage and raw values for tooltip
            cellValue = {
              displayValue: percentValue,
              tooltip: `${positiveCount}/${totalItems}`, // Raw values for tooltip
              percent: true,                             // Flag to identify percent cells
              positiveCount: positiveCount,              // Store raw values for reference
              totalItems: totalItems
            };
          } else {
            // For quantity mode, just use the count of positive items
            cellValue = positiveCount;
          }
          
          // Store calculated value for this month
          rowData[month] = cellValue;
          
          // Update totals for average calculation
          // Si es un objeto con displayValue (modo porcentaje), usar ese valor
          if (typeof cellValue === 'object' && cellValue !== null && 'displayValue' in cellValue) {
            totalSum += cellValue.displayValue;
          } else {
            // Si es un número simple (modo cantidad), usarlo directamente
            totalSum += Number(cellValue);
          }
          monthCount++;
        } else {
          rowData[month] = null; // No data for this month
        }
      });
      
      // Calculate average percentage or sum across all months depending on mode
      if (isPercentMode) {
        // En modo porcentaje, calcular el promedio
        rowData.average = monthCount > 0 ? Math.round(totalSum / monthCount) : 0;
      } else {
        // En modo cantidad, calcular la suma total de la fila
        rowData.average = totalSum;
      }
      
      return rowData;
    });
    
    // Calcular el promedio general de todos los promedios
    let grandTotalSum = 0;
    let grandTotalCount = 0;
    
    // Sumar todos los promedios válidos
    this.monthlyTableData.forEach(row => {
      if (row.average !== null && row.average !== undefined && !isNaN(row.average)) {
        grandTotalSum += row.average;
        grandTotalCount++;
      }
    });
    
    // Calcular el promedio general o la suma total según el modo
    let grandTotalAverage;
    if (isPercentMode) {
      // En modo porcentaje, calcular el promedio
      grandTotalAverage = grandTotalCount > 0 ? Math.round(grandTotalSum / grandTotalCount) : 0;
    } else {
      // En modo cantidad, simplemente sumar todos los totales
      grandTotalAverage = grandTotalSum;
    }
    
    // Añadir fila de totalizador con promedios o totales por mes según el modo
    const totalsRow: any = {
      name: isPercentMode ? 'PROMEDIO GENERAL' : 'TOTAL GENERAL',
      isTotal: true,
      average: grandTotalAverage
    };
    
    // Calcular valores por mes (columna) para la fila de totales
    this.monthsInRange.forEach(month => {
      let monthSum = 0;
      let monthCount = 0;
      
      // Sumar valores válidos de cada mes
      this.monthlyTableData.forEach(row => {
        if (row[month] !== null && row[month] !== undefined && !isNaN(row[month])) {
          monthSum += row[month];
          monthCount++;
        }
      });
      
      // Asignar el valor del mes a la fila de totales según el modo
      if (isPercentMode) {
        // En modo porcentaje, calcular el promedio
        totalsRow[month] = monthCount > 0 ? Math.round(monthSum / monthCount) : null;
      } else {
        // En modo cantidad, usar la suma total
        totalsRow[month] = monthCount > 0 ? monthSum : null;
      }
    });
    
    // Agregar la fila de totalizador a la tabla
    this.monthlyTableData.push(totalsRow);
    
    // // console.log('Generated monthly table with totals:', this.monthlyTableData);
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

  // Se han eliminado los métodos relacionados con KPI ya que no se utilizan actualmente en el template:
  // - calcularPorcentajeGeneralDeCumplimiento()
  // - getKpiValue()
  // - getKpiClass()

  /**
   * Trunca una etiqueta si es demasiado larga
   */
  private truncateLabel(label: string, maxLength: number): string {
    return label.length > maxLength
      ? `${label.substring(0, maxLength)}...`
      : label;
  }
  
  /**
   * Abre popup con los datos filtrados que están generando el gráfico
   * Utiliza las columnas definidas en la configuración del reporte si existen
   */
  openDetailsPopup(): void {
    // Importación dinámica para evitar dependencias circulares
    import('./details-data/details-data.component').then(({ DetailsDataComponent }) => {
      // Obtener columnas a mostrar desde la configuración del reporte actual
      let columnas: string[] = [];
      
      // Usar columnas de la configuración del reporte si están disponibles
      if (this.reportConfig && this.reportConfig.columnsTable && this.reportConfig.columnsTable.length > 0) {
        columnas = [...this.reportConfig.columnsTable];
        // console.log('Usando columnas de configuración:', columnas);
      }
      
      // Abrir diálogo con los datos filtrados
      this.dialog.open(DetailsDataComponent, {
        width: '700px', 
        height: '600px',
        maxWidth: '700px',
        minWidth: '700px',
        data: {
          data: this.filteredData,
          title: `${this.title} - Datos Filtrados`,
          draggable: true,  // Marcador para habilitar arrastre en el componente
          columns: columnas  // Pasar columnas desde la configuración
        },
        panelClass: ['details-data-dialog', 'compact-dialog', 'draggable-dialog'],
        disableClose: false,
        autoFocus: false,
        hasBackdrop: true
      });
    });
  }
}
