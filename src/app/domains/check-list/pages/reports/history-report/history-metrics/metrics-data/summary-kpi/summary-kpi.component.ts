import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { ReportConfig } from '../../../models/report-config.model';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-summary-kpi',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatCardModule, 
    MatDividerModule, 
    MatTooltipModule, 
    NgChartsModule
  ],
  templateUrl: './summary-kpi.component.html',
  styleUrls: ['./summary-kpi.component.scss']
})
export class SummaryKpiComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() completeData: any[] = [];
  @Input() activeFilters: any = {};
  @Input() reportConfig?: ReportConfig;
  @Input() title: string = 'RESUMEN KPI'; // Título personalizable con valor predeterminado
  
  // Indicador de si hay datos para mostrar
  hasData: boolean = false;
  
  // Datos procesados para todos los campos configurados
  summaryData: Record<string, Record<string, number>> = {};
  
  // Mapa de instancias de Chart.js (dinámico)
  private chartInstances: Record<string, Chart> = {};
  
  // Mapa de iconos por tipo de campo
  private fieldIcons: Record<string, string> = {
    'estado': 'check_circle',
    'tipo': 'category',
    'obra': 'domain',
    'fecha': 'calendar_today',
    'default': 'label'
  };
  
  // Colores para los gráficos
  chartColors: string[] = [
    '#5B9BD5', '#ED7D31', '#70AD47', '#FFC000', '#7030A0',
    '#C00000', '#43682B', '#255E91', '#9E480E', '#636363',
    '#997300', '#A5A5A5', '#4472C4', '#FF3300', '#33CCCC'
  ];
  
  // Campo principal utilizado para el valor principal (antes era hardcodeado 'estado')
  principalValueField: string = 'estado';
  
  // Campo secundario utilizado para agrupar datos (antes era hardcodeado 'tipo')
  secondaryValueField: string = 'tipo';

  /**
   * Devuelve un color para un índice determinado en el gráfico
   * @param index Índice del elemento en la lista
   * @param value Valor para el que se busca el color
   * @returns Color en formato hexadecimal
   */
  getChartColor(index: number, value?: string): string {
    // Si tenemos configuración de reporte con colores y un valor definido, intentamos obtener el color personalizado
    if (this.reportConfig?.chartColors && value) {
      // Buscamos en el array de ColorConfig si hay una configuración para el valor dado
      const colorConfig = this.reportConfig.chartColors.find((cc: {indexItem: string, color: string}) => cc.indexItem === value);
      if (colorConfig) {
        return colorConfig.color;
      }
    }
    
    // Si no hay color personalizado, usamos el color por índice
    return this.chartColors[index % this.chartColors.length];
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia la configuración del reporte, actualizamos los campos a utilizar
    if (changes['reportConfig'] && this.reportConfig) {
      // Actualizamos el campo principal y secundario desde la configuración
      this.principalValueField = this.reportConfig.principalValue || 'estado';
      console.log('Configuración de reporte cargada:', 
        { principalValue: this.principalValueField, summaryValues: this.reportConfig.summaryValues });
    }
    
    // IMPORTANTE: Solo procesamos los datos cuando cambia la data completa o la configuración
    // Ignoramos los cambios en activeFilters porque este componente NO debe reaccionar a filtros
    if (changes['completeData'] || changes['reportConfig']) {
      this.procesarDatosCompletos();
      // Inicializar o actualizar los gráficos
      this.initializeCharts();
    }
  }
  
  // Método para obtener el total de registros
  getTotalRegistros(): number {
    if (!this.reportConfig?.principalValue || !this.summaryData[this.reportConfig.principalValue]) {
      return 0;
    }
    
    return Object.values(this.summaryData[this.reportConfig.principalValue]).reduce((a, b) => a + b, 0);
  }
  
  /**
   * Procesa los datos completos para generar las estadísticas por cada campo configurado
   * IMPORTANTE: Siempre trabajamos con la data completa, no aplicamos filtros internamente
   * porque cada componente debe mostrar siempre la distribución completa de los datos.
   */
  private procesarDatosCompletos(): void {
    // Reiniciar datos
    this.summaryData = {};
    this.hasData = this.completeData && this.completeData.length > 0;
    
    if (!this.hasData || !this.reportConfig?.summaryValues) return;
    
    // IMPORTANTE: Usamos siempre la data completa, NO aplicamos filtros
    // Esto permite que el componente muestre la distribución total de datos
    // independientemente de los filtros aplicados en otros componentes
    // Realizamos una copia profunda (deep copy) para asegurar que no modificamos la data original
    const datosCompletos = JSON.parse(JSON.stringify(this.completeData));
    
    console.log('Total de datos a procesar:', datosCompletos.length);
    
    // Procesar cada campo configurado en summaryValues
    this.reportConfig.summaryValues?.forEach(fieldName => {
      // Inicializar el contador para este campo
      this.summaryData[fieldName] = {};
      
      // Contar ocurrencias de cada valor único en este campo
      datosCompletos.forEach((item: Record<string, any>) => {
        const value = item[fieldName];
        if (value !== undefined && value !== null) {
          // Convertir a string para usar como clave
          const valueKey = String(value);
          if (!this.summaryData[fieldName][valueKey]) {
            this.summaryData[fieldName][valueKey] = 0;
          }
          this.summaryData[fieldName][valueKey]++;
        }
      });
    });
    
    console.log('Datos procesados:', this.summaryData);
  }

  ngAfterViewInit(): void {
    // Inicializar los gráficos si ya tenemos datos
    this.initializeCharts();
  }

  /**
   * Inicializa o actualiza los gráficos dinámicamente según los campos configurados
   */
  private initializeCharts(): void {
    // Esperar al siguiente ciclo para asegurarnos que el DOM esté listo
    setTimeout(() => {
      if (!this.reportConfig?.summaryValues || !this.hasData) return;
      
      // Para cada campo configurado, crear o actualizar su gráfico
      this.reportConfig.summaryValues?.forEach((fieldName: string) => {
        const canvasId = `chart-${fieldName}`;
        const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
        
        if (canvasElement) {
          // Destruir gráfico anterior si existe
          if (this.chartInstances[fieldName]) {
            this.chartInstances[fieldName].destroy();
            delete this.chartInstances[fieldName];
          }
          
          // Crear nuevo gráfico si tenemos datos para este campo
          if (this.summaryData[fieldName] && Object.keys(this.summaryData[fieldName]).length > 0) {
            this.createChart(fieldName, canvasElement);
          }
        }
      });
    }, 0);
  }

  /**
   * Crea un gráfico tipo donut para el campo especificado
   */
  private createChart(fieldName: string, canvasElement: HTMLCanvasElement): void {
    const ctx = canvasElement.getContext('2d');
    if (!ctx || !this.summaryData[fieldName]) return;
    
    const values = Object.keys(this.summaryData[fieldName]);
    const counts = values.map((value: string) => this.summaryData[fieldName][value]);
    
    // Configuración del gráfico de torta
    this.chartInstances[fieldName] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: values,
        datasets: [{
          data: counts,
          backgroundColor: values.map((value: string, i: number) => this.getChartColor(i, value)),
          borderWidth: 0
        }]
      },
      options: this.getChartOptions()
    });
  }

  /**
   * Devuelve las opciones de configuración para los gráficos
   */
  private getChartOptions(): ChartConfiguration<'doughnut'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Ocultamos completamente la leyenda
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw as number;
              const total = context.chart.data.datasets[0].data.reduce(
                (a: number, b: number) => a + b, 0
              );
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      layout: {
        padding: 5
      },
      elements: {
        arc: {
          borderWidth: 0
        }
      },
      // Agregamos un cutout para que el donut sea más visible al no tener leyenda
      cutout: '70%'
    };
  }

  ngOnDestroy(): void {
    // Limpiar instancias de Chart.js para evitar memory leaks
    Object.keys(this.chartInstances).forEach(fieldName => {
      if (this.chartInstances[fieldName]) {
        this.chartInstances[fieldName].destroy();
      }
    });
  }

  /**
   * Trunca una etiqueta si es demasiado larga
   * @param label Etiqueta a truncar
   * @param maxLength Longitud máxima permitida
   * @returns Etiqueta truncada con puntos suspensivos si excede la longitud máxima
   */
  private truncateLabel(label: string, maxLength: number): string {
    return label.length > maxLength
      ? `${label.substring(0, maxLength)}...`
      : label;
  }

  /**
   * Devuelve el icono a mostrar para un campo específico
   */
  public getFieldIcon(fieldName: string): string {
    return this.fieldIcons[fieldName?.toLowerCase()] || this.fieldIcons["default"];
  }
  
  /**
   * Convierte el nombre técnico de un campo a un nombre legible
   */
  public getFieldDisplayName(fieldName: string): string {
    if (!fieldName) return '';
    // Capitalizar primera letra y separar palabras con espacio
    return fieldName.charAt(0).toUpperCase() + 
      fieldName.slice(1).replace(/([A-Z])/g, ' $1');
  }
  
  /**
   * Devuelve las claves de un objeto como array
   */
  public getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }
  
  /**
   * Verifica si falta la configuración de resumen o está vacía
   */
  public hasMissingSummaryConfig(): boolean {
    if (!this.reportConfig) return true;
    if (!this.reportConfig.summaryValues) return true;
    return this.reportConfig.summaryValues.length === 0;
  }
}
