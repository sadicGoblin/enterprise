import { Component, Input, AfterViewInit, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgChartsModule } from 'ng2-charts';
import { Chart } from 'chart.js';

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
export class SummaryKpiComponent implements OnChanges, AfterViewInit {
  @Input() estadosData: {[key: string]: number} = {};
  @Input() tiposData: {[key: string]: number} = {};
  
  // Referencias a los canvas de los gráficos
  @ViewChild('estadosChart') estadosChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tiposChart') tiposChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Instancias de los gráficos
  private estadosChart: Chart | null = null;
  private tiposChart: Chart | null = null;

  // Colores para gráficos y visualizaciones
  public chartColors: string[] = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Colores Google Material
    '#7986CB', '#33B679', '#8E24AA', '#039BE5', // Colores complementarios
    '#0B8043', '#D50000', '#E67C73', '#F6BF26', // Variaciones adicionales
    '#F4511E', '#616161', '#A79B8E', '#3949AB'  // Más colores Material
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estadosData'] || changes['tiposData']) {
      this.updateCharts();
    }
  }

  ngAfterViewInit(): void {
    // Inicializamos los gráficos después de que los elementos del DOM estén disponibles
    setTimeout(() => {
      this.initCharts();
    }, 0);
  }

  // Inicializar todos los gráficos
  private initCharts(): void {
    // Sólo inicializamos si hay datos
    if (this.getObjectKeys(this.estadosData).length > 0) {
      this.initEstadosChart();
    }
    
    if (this.getObjectKeys(this.tiposData).length > 0) {
      this.initTiposChart();
    }
  }
  
  // Actualizar los gráficos
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

  // Calcula el porcentaje de cumplimiento basado en los estados
  getKpiValue(estadosData: {[key: string]: number}): number {
    // Si no hay datos, devolvemos 0
    if (!estadosData || Object.keys(estadosData).length === 0) return 0;
    
    // Calculamos el total de registros
    const total = Object.values(estadosData).reduce((sum, value) => sum + value, 0);
    if (total === 0) return 0;
    
    // Calculamos el porcentaje de cumplimiento (estados completados / total)
    // Asumimos que los estados completados son 'Completado', 'Finalizado' o similar
    const completados = Object.entries(estadosData)
      .filter(([estado]) => 
        estado.toLowerCase().includes('completado') || 
        estado.toLowerCase().includes('finalizado'))
      .reduce((sum, [, value]) => sum + value, 0);
    
    return Math.round((completados / total) * 100);
  }
  
  // Inicializar gráfico de Estados
  private initEstadosChart(): void {
    if (!this.estadosChartCanvas) return;
    
    const ctx = this.estadosChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const labels = this.getObjectKeys(this.estadosData);
    const data = labels.map(key => this.estadosData[key]);
    const colors = labels.map((_, i) => this.chartColors[i % this.chartColors.length]);
    
    this.estadosChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          hoverBackgroundColor: colors.map(color => this.adjustAlpha(color, 0.8)),
          borderWidth: 0,
          borderColor: 'transparent'
        }]
      },
      options: {
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
              label: (context) => {
                const label = context.label || '';
                const value = Number(context.raw || 0);
                const dataArray = context.chart.data.datasets[0].data;
                
                // Asegurar que total sea tratado como número
                let totalValue = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  totalValue += Number(dataArray[i] || 0);
                }
                
                let percentage = 0;
                if (totalValue > 0) {
                  percentage = Math.round((value * 100) / totalValue);
                }
                
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        // Estas opciones son compatibles con Chart.js v3
        animation: {
          duration: 1000
        }
      }
    });
  }
  
  // Inicializar gráfico de Tipos
  private initTiposChart(): void {
    if (!this.tiposChartCanvas) return;
    
    const ctx = this.tiposChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const labels = this.getObjectKeys(this.tiposData);
    const data = labels.map(key => this.tiposData[key]);
    // Offset para usar colores diferentes
    const colors = labels.map((_, i) => this.chartColors[(i + 3) % this.chartColors.length]);
    
    this.tiposChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          hoverBackgroundColor: colors.map(color => this.adjustAlpha(color, 0.8)),
          borderWidth: 0,
          borderColor: 'transparent'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(20, 20, 30, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 8,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = Number(context.raw || 0);
                const dataArray = context.chart.data.datasets[0].data;
                
                // Asegurar que total sea tratado como número
                let totalValue = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  totalValue += Number(dataArray[i] || 0);
                }
                
                let percentage = 0;
                if (totalValue > 0) {
                  percentage = Math.round((value * 100) / totalValue);
                }
                
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        // Estas opciones son compatibles con Chart.js v3
        animation: {
          duration: 1000
        }
      }
    });
  }
  
  // Ajusta la transparencia de un color
  private adjustAlpha(color: string, alpha: number): string {
    // Convertir color hex a RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Método auxiliar para obtener las claves de un objeto
  public getObjectKeys(obj: {[key: string]: any}): string[] {
    return Object.keys(obj || {});
  }
}
