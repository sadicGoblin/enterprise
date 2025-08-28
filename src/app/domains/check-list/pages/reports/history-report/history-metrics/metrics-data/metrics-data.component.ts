import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-metrics-data',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, MatDividerModule, MatTooltipModule, NgChartsModule],
  templateUrl: './metrics-data.component.html',
  styleUrls: ['./metrics-data.component.scss']
})
export class MetricsDataComponent implements OnChanges, AfterViewInit {
  @Input() data: any[] = [];
  
  // Datos procesados para métricas
  totalRegistros: number = 0;
  registrosPorTipo: {[key: string]: number} = {};
  registrosPorEstado: {[key: string]: number} = {};
  registrosPorObra: {[key: string]: number} = {};
  registrosPorUsuario: {[key: string]: number} = {};
  
  // Referencias a los canvas de los gráficos
  @ViewChild('estadosChart') estadosChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tiposChart') tiposChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Instancias de los gráficos
  private estadosChart: Chart | null = null;
  private tiposChart: Chart | null = null;

  // Colores para gráficos y visualizaciones
  private chartColors: string[] = [
    '#4285F4', '#EA4335', '#FBBC05', '#34A853', // Colores Google Material
    '#7986CB', '#33B679', '#8E24AA', '#039BE5', // Colores complementarios
    '#0B8043', '#D50000', '#E67C73', '#F6BF26', // Variaciones adicionales
    '#F4511E', '#616161', '#A79B8E', '#3949AB'  // Más colores Material
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.procesarDatos();
    }
  }

  procesarDatos(): void {
    this.totalRegistros = this.data.length;
    
    // Reset contadores
    this.registrosPorTipo = {};
    this.registrosPorEstado = {};
    this.registrosPorObra = {};
    this.registrosPorUsuario = {};
    
    // Procesar datos para conteos
    this.data.forEach(registro => {
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
    
    // Actualizar gráficos después de procesar datos
    this.updateCharts();
  }
  
  // Métodos auxiliares para el template
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
  
  // Retorna un color del arreglo de colores basado en el índice
  getChartColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }
  
  // Genera un color de avatar basado en el índice
  getAvatarColor(index: number): string {
    const baseColors = [
      '#3F51B5', '#F44336', '#4CAF50', '#FFC107', '#2196F3', 
      '#9C27B0', '#FF5722', '#795548', '#607D8B', '#009688'
    ];
    return baseColors[index % baseColors.length];
  }
  
  // Extrae las iniciales del nombre (máximo 2 caracteres)
  getInitials(name: string): string {
    if (!name) return '??';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '??';
    
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
  
  // Implementación de AfterViewInit para inicializar los gráficos
  ngAfterViewInit(): void {
    // Inicializamos los gráficos después de que los elementos del DOM estén disponibles
    setTimeout(() => {
      this.initCharts();
    }, 0);
  }
  
  // Inicializar los gráficos
  private initCharts(): void {
    // Sólo inicializamos si hay datos
    if (this.getObjectKeys(this.registrosPorEstado).length > 0) {
      this.initEstadosChart();
    }
    
    if (this.getObjectKeys(this.registrosPorTipo).length > 0) {
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
  
  // Inicializar gráfico de Estados
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
          borderWidth: 2,
          borderColor: 'rgba(20, 20, 30, 0.6)'
        }]
      },
      options: this.getChartOptions()
    });
  }
  
  // Inicializar gráfico de Tipos
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
          borderWidth: 2,
          borderColor: 'rgba(20, 20, 30, 0.6)'
        }]
      },
      options: this.getChartOptions()
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
  
  // Configuración común para los gráficos
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
}
