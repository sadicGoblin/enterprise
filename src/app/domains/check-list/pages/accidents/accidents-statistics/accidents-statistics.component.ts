import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter } from '../../../../../shared/adapters/custom-date-adapter';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { EstadisticasApiResponse } from '../models/accident.model';
import { AccidenteService } from '../../../services/accidente.service';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-accidents-statistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: MAT_DATE_FORMATS, useValue: {
      parse: { dateInput: 'DD/MM/YYYY' },
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY'
      }
    }}
  ],
  templateUrl: './accidents-statistics.component.html',
  styleUrl: './accidents-statistics.component.scss'
})
export class AccidentsStatisticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gravedadChart', { static: false }) gravedadChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tipoChart', { static: false }) tipoChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('riesgoChart', { static: false }) riesgoChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tendenciaChart', { static: false }) tendenciaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tendenciaTipoChart', { static: false }) tendenciaTipoChartRef!: ElementRef<HTMLCanvasElement>;

  gravedadChart: Chart | null = null;
  tipoChart: Chart | null = null;
  riesgoChart: Chart | null = null;
  tendenciaChart: Chart | null = null;
  tendenciaTipoChart: Chart | null = null;

  selectedYear: number = new Date().getFullYear();
  years: number[] = [2024, 2025, 2026];

  // Filtros de fecha
  tipoFecha: 'creacion' | 'accidente' = 'creacion';
  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;

  isLoading = true;
  totalAccidentes = 0;
  porGravedad: any[] = [];
  porTipo: any[] = [];
  porRiesgo: any[] = [];
  porMes: any[] = [];
  porParteCuerpo: any[] = [];
  porEmpresa: any[] = [];
  diasPerdidosPromedio: number = 0;
  accidentesRaw: any[] = [];

  constructor(
    private router: Router,
    private accidenteService: AccidenteService
  ) {}

  ngOnInit(): void {
    this.initializeDateFilters();
    this.loadStats();
  }

  private initializeDateFilters(): void {
    const now = new Date();
    
    // Desde: Primer día del año a las 00:00:00
    this.fechaDesde = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    
    // Hasta: Hoy a las 23:59:59
    this.fechaHasta = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  }

  applyDateFilters(): void {
    this.loadStats();
  }

  clearDateFilters(): void {
    this.initializeDateFilters();
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Charts initialized after data loads
  }

  ngOnDestroy(): void {
    this.gravedadChart?.destroy();
    this.tipoChart?.destroy();
    this.riesgoChart?.destroy();
    this.tendenciaChart?.destroy();
    this.tendenciaTipoChart?.destroy();
  }

  loadStats(): void {
    this.isLoading = true;
    
    // Preparar filtros para obtener el listado
    const filters: any = {
      TipoFecha: this.tipoFecha
    };
    
    if (this.fechaDesde) {
      const year = this.fechaDesde.getFullYear();
      const month = String(this.fechaDesde.getMonth() + 1).padStart(2, '0');
      const day = String(this.fechaDesde.getDate()).padStart(2, '0');
      const hours = String(this.fechaDesde.getHours()).padStart(2, '0');
      const minutes = String(this.fechaDesde.getMinutes()).padStart(2, '0');
      const seconds = String(this.fechaDesde.getSeconds()).padStart(2, '0');
      filters.FechaDesde = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    if (this.fechaHasta) {
      const year = this.fechaHasta.getFullYear();
      const month = String(this.fechaHasta.getMonth() + 1).padStart(2, '0');
      const day = String(this.fechaHasta.getDate()).padStart(2, '0');
      const hours = String(this.fechaHasta.getHours()).padStart(2, '0');
      const minutes = String(this.fechaHasta.getMinutes()).padStart(2, '0');
      const seconds = String(this.fechaHasta.getSeconds()).padStart(2, '0');
      filters.FechaHasta = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    // Obtener listado de accidentes y procesar estadísticas en el frontend
    this.accidenteService.listarAccidentes(filters).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.accidentesRaw = Array.isArray(response.data) ? response.data : Object.values(response.data);
          console.log('[AccidentsStats] Total accidentes:', this.accidentesRaw.length);
          
          // Procesar estadísticas
          this.processStatistics();
          
          setTimeout(() => this.initializeCharts(), 100);
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('[AccidentsStatisticsComponent] Error loading stats:', err);
        this.isLoading = false;
      }
    });
  }

  processStatistics(): void {
    this.totalAccidentes = this.accidentesRaw.length;
    
    // Agrupar por Gravedad (CalificacionPS)
    const gravedadMap = new Map<string, number>();
    this.accidentesRaw.forEach(acc => {
      const gravedad = acc.CalificacionPS || 'Sin especificar';
      gravedadMap.set(gravedad, (gravedadMap.get(gravedad) || 0) + 1);
    });
    this.porGravedad = Array.from(gravedadMap.entries()).map(([Gravedad, Total]) => ({ Gravedad, Total: Total.toString() }));
    
    // Agrupar por Tipo de Accidente
    const tipoMap = new Map<string, number>();
    this.accidentesRaw.forEach(acc => {
      const tipo = acc.TipoAccidente || 'Sin especificar';
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    });
    this.porTipo = Array.from(tipoMap.entries()).map(([TipoAccidente, Total]) => ({ TipoAccidente, Total: Total.toString() }));
    
    // Agrupar por Riesgo Asociado (TODOS)
    const riesgoMap = new Map<string, number>();
    this.accidentesRaw.forEach(acc => {
      const riesgo = acc.RiesgoAsociado;
      if (riesgo) {
        riesgoMap.set(riesgo, (riesgoMap.get(riesgo) || 0) + 1);
      }
    });
    this.porRiesgo = Array.from(riesgoMap.entries())
      .map(([Riesgo, Total]) => ({ Riesgo, Total: Total.toString() }))
      .sort((a, b) => parseInt(b.Total) - parseInt(a.Total));
    
    // Agrupar por Parte del Cuerpo
    const parteCuerpoMap = new Map<string, number>();
    this.accidentesRaw.forEach(acc => {
      const parte = acc.ParteCuerpo || 'Sin especificar';
      if (parte && parte !== 'Sin especificar') {
        parteCuerpoMap.set(parte, (parteCuerpoMap.get(parte) || 0) + 1);
      }
    });
    this.porParteCuerpo = Array.from(parteCuerpoMap.entries())
      .map(([ParteCuerpo, Total]) => ({ ParteCuerpo, Total: Total.toString() }))
      .sort((a, b) => parseInt(b.Total) - parseInt(a.Total));
    
    // Agrupar por Mes
    const mesMap = new Map<string, number>();
    this.accidentesRaw.forEach(acc => {
      if (acc.FechaAccidente) {
        const fecha = new Date(acc.FechaAccidente);
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        mesMap.set(mes, (mesMap.get(mes) || 0) + 1);
      }
    });
    this.porMes = Array.from(mesMap.entries())
      .map(([Mes, Total]) => ({ Mes, Total: Total.toString() }))
      .sort((a, b) => a.Mes.localeCompare(b.Mes));
    
    // Agrupar por Empresa
    const empresaMap = new Map<string, number>();
    this.accidentesRaw.forEach(acc => {
      const empresa = acc.NombreEmpresa || 'Sin especificar';
      empresaMap.set(empresa, (empresaMap.get(empresa) || 0) + 1);
    });
    this.porEmpresa = Array.from(empresaMap.entries())
      .map(([Empresa, Total]) => ({ Empresa, Total: Total.toString() }))
      .sort((a, b) => parseInt(b.Total) - parseInt(a.Total));
    
    // Calcular promedio de días perdidos estimados
    let totalDias = 0;
    let countConDias = 0;
    this.accidentesRaw.forEach(acc => {
      const dias = parseInt(acc.DiasPerdidosEstimados || '0', 10);
      if (dias > 0) {
        totalDias += dias;
        countConDias++;
      }
    });
    this.diasPerdidosPromedio = countConDias > 0 ? Math.round(totalDias / countConDias) : 0;
    
    console.log('[AccidentsStats] Procesado - porTipo:', this.porTipo);
    console.log('[AccidentsStats] Procesado - porGravedad:', this.porGravedad);
    console.log('[AccidentsStats] Procesado - porEmpresa:', this.porEmpresa);
    console.log('[AccidentsStats] Procesado - Días perdidos promedio:', this.diasPerdidosPromedio);
  }

  initializeCharts(): void {
    // Destruir gráficos existentes
    this.gravedadChart?.destroy();
    this.tipoChart?.destroy();
    this.riesgoChart?.destroy();
    this.tendenciaChart?.destroy();
    this.tendenciaTipoChart?.destroy();
    
    setTimeout(() => {
      console.log('[AccidentsStats] Creando gráficos...');
      console.log('[AccidentsStats] porTipo antes de crear gráfico:', this.porTipo);
      this.createGravedadChart();
      this.createTipoChart();
      this.createRiesgoChart();
      this.createTendenciaChart();
      this.createTendenciaTipoChart();
    }, 100);
  }

  createGravedadChart(): void {
    const ctx = this.gravedadChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const labels = this.porGravedad.map(g => g.Gravedad || g.CalificacionPS);
    const data = this.porGravedad.map(g => parseInt(g.Total, 10));
    const colorMap: Record<string, string> = {
      'Leve': '#4caf50', 
      'Menor': '#8bc34a', 
      'Importante': '#ff9800', 
      'Grave': '#f44336', 
      'Fatal': '#9c27b0'
    };
    const colors = labels.map(l => colorMap[l] || '#607d8b');

    this.gravedadChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#2d3042'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 12,
              font: { size: 11 },
              color: '#ffffff',
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.label}: ${context.raw} accidentes`
            }
          },
          datalabels: {
            color: '#ffffff',
            font: { weight: 'bold', size: 14 },
            formatter: (value: number) => value > 0 ? value : '',
            anchor: 'center',
            align: 'center'
          }
        }
      }
    });
  }

  createTendenciaChart(): void {
    const ctx = this.tendenciaChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthData = new Array(12).fill(0);

    this.porMes.forEach(m => {
      const parts = m.Mes.split('-');
      if (parts.length === 2) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          monthData[monthIndex] = parseInt(m.Total, 10);
        }
      }
    });

    this.tendenciaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Accidentes',
          data: monthData,
          borderColor: '#f57c00',
          backgroundColor: 'rgba(245, 124, 0, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#f57c00'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Tendencia Mensual', font: { size: 14, weight: 'bold' } },
          datalabels: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  onYearChange(): void {
    this.tendenciaChart?.destroy();
    this.loadStats();
  }

  goToList(): void {
    this.router.navigate(['/check-list/accidents/list']);
  }

  goToForm(): void {
    this.router.navigate(['/check-list/accidents/register']);
  }

  getGravedadTotal(gravedad: string): number {
    const found = this.porGravedad.find(g => g.Gravedad === gravedad);
    return found ? parseInt(found.Total, 10) : 0;
  }

  // Métodos auxiliares para el nuevo diseño
  getGravedadColor(gravedad: string): string {
    const colorMap: Record<string, string> = {
      'Leve': '#4caf50',
      'Menor': '#8bc34a',
      'Importante': '#ff9800',
      'Grave': '#f44336',
      'Fatal': '#9c27b0'
    };
    return colorMap[gravedad] || '#607d8b';
  }

  getRiesgoColor(index: number): string {
    const colors = ['#5B9BD5', '#ED7D31', '#70AD47', '#FFC000', '#7030A0'];
    return colors[index % colors.length];
  }

  getUniqueMonthsCount(): number {
    return this.porMes.length;
  }

  getNotCompliantCount(): number {
    // Simular conteo de no cumplidos (puedes ajustar según tus datos)
    return Math.floor(this.totalAccidentes * 0.35);
  }

  getCompliantCount(): number {
    // Simular conteo de cumplidos
    return this.totalAccidentes - this.getNotCompliantCount();
  }

  generateColors(count: number): string[] {
    const baseColors = ['#5B9BD5', '#ED7D31', '#70AD47', '#FFC000', '#7030A0', '#4472C4', '#A5A5A5', '#264478', '#9E480E', '#636363'];
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  createTipoChart(): void {
    const ctx = this.tipoChartRef?.nativeElement?.getContext('2d');
    if (!ctx) {
      console.error('[AccidentsStats] No se pudo obtener contexto del canvas de Tipo');
      return;
    }

    if (!this.porTipo || this.porTipo.length === 0) {
      console.warn('[AccidentsStats] No hay datos de tipo de accidente. porTipo:', this.porTipo);
      return;
    }

    console.log('[AccidentsStats] Creando gráfico de Tipo con datos:', this.porTipo);
    const labels = this.porTipo.map(t => t.TipoAccidente);
    const data = this.porTipo.map(t => parseInt(t.Total, 10));
    const colors = ['#5B9BD5', '#ED7D31', '#70AD47', '#FFC000'];
    
    console.log('[AccidentsStats] Labels:', labels);
    console.log('[AccidentsStats] Data:', data);

    this.tipoChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#2d3042'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 12,
              font: { size: 11 },
              color: '#ffffff',
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.label}: ${context.raw} accidentes`
            }
          },
          datalabels: {
            color: '#ffffff',
            font: { weight: 'bold', size: 14 },
            formatter: (value: number) => value > 0 ? value : '',
            anchor: 'center',
            align: 'center'
          }
        }
      }
    });
  }

  createRiesgoChart(): void {
    const ctx = this.riesgoChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    if (!this.porRiesgo || this.porRiesgo.length === 0) {
      console.warn('[AccidentsStats] No hay datos de riesgos');
      return;
    }

    const labels = this.porRiesgo.map(r => r.Riesgo);
    const data = this.porRiesgo.map(r => parseInt(r.Total, 10));
    const colors = this.generateColors(this.porRiesgo.length);

    this.riesgoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cantidad',
          data,
          backgroundColor: colors,
          borderWidth: 0,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.raw} accidentes`
            }
          },
          datalabels: {
            color: '#ffffff',
            font: { weight: 'bold', size: 12 },
            anchor: 'end',
            align: 'end',
            formatter: (value: number) => value
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#ffffff' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#ffffff', font: { size: 10 } }
          }
        }
      }
    });
  }

  createTendenciaTipoChart(): void {
    const ctx = this.tendenciaTipoChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    // Obtener todos los tipos únicos
    const tipos = [...new Set(this.accidentesRaw.map(acc => acc.TipoAccidente).filter(t => t))];
    
    // Obtener todos los meses únicos y ordenarlos
    const mesesSet = new Set<string>();
    this.accidentesRaw.forEach(acc => {
      if (acc.FechaAccidente) {
        const fecha = new Date(acc.FechaAccidente);
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        mesesSet.add(mes);
      }
    });
    const meses = Array.from(mesesSet).sort();

    // Crear datasets por tipo
    const colorMap: Record<string, string> = {
      'TRABAJO': '#60a5fa',
      'COMÚN': '#f59e0b',
      'NEP': '#10b981',
      'Sin especificar': '#6b7280'
    };

    const datasets = tipos.map(tipo => {
      const data = meses.map(mes => {
        return this.accidentesRaw.filter(acc => {
          if (!acc.FechaAccidente) return false;
          const fecha = new Date(acc.FechaAccidente);
          const accMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          return accMes === mes && acc.TipoAccidente === tipo;
        }).length;
      });

      return {
        label: tipo,
        data,
        borderColor: colorMap[tipo] || '#6b7280',
        backgroundColor: colorMap[tipo] || '#6b7280',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: colorMap[tipo] || '#6b7280',
        pointBorderColor: '#2d3042',
        pointBorderWidth: 2
      };
    });

    this.tendenciaTipoChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: meses,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#ffffff',
              font: { size: 12 },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context: any) => ` ${context.dataset.label}: ${context.raw} accidentes`
            }
          },
          datalabels: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: { color: '#ffffff' },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }
}
