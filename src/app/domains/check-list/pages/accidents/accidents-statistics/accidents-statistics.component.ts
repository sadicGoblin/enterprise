import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MOCK_ESTADISTICAS, MOCK_ACCIDENTS } from '../models/accident.model';

Chart.register(...registerables);

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
    MatTableModule
  ],
  templateUrl: './accidents-statistics.component.html',
  styleUrl: './accidents-statistics.component.scss'
})
export class AccidentsStatisticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gravedadChart') gravedadChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tipoChart') tipoChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('organismoChart') organismoChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tendenciaChart') tendenciaChartRef!: ElementRef<HTMLCanvasElement>;

  gravedadChart: Chart | null = null;
  tipoChart: Chart | null = null;
  organismoChart: Chart | null = null;
  tendenciaChart: Chart | null = null;

  selectedYear: number = 2025;
  years: number[] = [2023, 2024, 2025];

  // Estadísticas del modelo
  stats = MOCK_ESTADISTICAS;
  accidents = MOCK_ACCIDENTS;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Charts will be initialized in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.gravedadChart?.destroy();
    this.tipoChart?.destroy();
    this.organismoChart?.destroy();
    this.tendenciaChart?.destroy();
  }

  initializeCharts(): void {
    setTimeout(() => {
      this.createGravedadChart();
      this.createTipoChart();
      this.createOrganismoChart();
      this.createTendenciaChart();
    }, 100);
  }

  createGravedadChart(): void {
    const ctx = this.gravedadChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.gravedadChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Leve', 'Menor', 'Importante', 'Grave', 'Fatal'],
        datasets: [{
          data: [
            this.stats.porGravedad.leve,
            this.stats.porGravedad.menor,
            this.stats.porGravedad.importante,
            this.stats.porGravedad.grave,
            this.stats.porGravedad.fatal
          ],
          backgroundColor: ['#4caf50', '#8bc34a', '#ff9800', '#f44336', '#9c27b0'],
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: { 
            position: 'bottom', 
            labels: { 
              padding: 15, 
              font: { size: 11 },
              usePointStyle: true,
              pointStyle: 'rectRounded'
            } 
          },
          title: { display: true, text: 'Distribución por Gravedad', font: { size: 14, weight: 'bold' }, padding: { bottom: 15 } },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.label}: ${context.raw} accidentes`
            }
          }
        }
      }
    });
  }

  createTipoChart(): void {
    const ctx = this.tipoChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.tipoChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Trabajo', 'Común', 'Fatal'],
        datasets: [{
          data: [
            this.stats.porTipo.trabajo,
            this.stats.porTipo.comun,
            this.stats.porTipo.fatal
          ],
          backgroundColor: ['#2196f3', '#ff9800', '#f44336'],
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: { 
            position: 'bottom', 
            labels: { 
              padding: 15, 
              font: { size: 11 },
              usePointStyle: true,
              pointStyle: 'rectRounded'
            } 
          },
          title: { display: true, text: 'Distribución por Tipo', font: { size: 14, weight: 'bold' }, padding: { bottom: 15 } },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.label}: ${context.raw} accidentes`
            }
          }
        }
      }
    });
  }

  createOrganismoChart(): void {
    const ctx = this.organismoChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.organismoChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['INARCO', 'Sub Contratistas'],
        datasets: [{
          label: 'Accidentes',
          data: [this.stats.porOrganismo.inarco, this.stats.porOrganismo.sc],
          backgroundColor: ['#1a237e', '#3f51b5'],
          borderRadius: 8,
          barThickness: 35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Por Organismo', font: { size: 14, weight: 'bold' }, padding: { bottom: 15 } },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.raw} accidentes`
            }
          }
        },
        scales: {
          x: { 
            beginAtZero: true, 
            ticks: { stepSize: 1 },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
  }

  createTendenciaChart(): void {
    const ctx = this.tendenciaChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    this.tendenciaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [{
          label: 'Accidentes',
          data: [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 2, 3],
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
          title: { display: true, text: `Tendencia Mensual ${this.selectedYear}`, font: { size: 14, weight: 'bold' } }
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
    this.createTendenciaChart();
  }

  goToList(): void {
    this.router.navigate(['/check-list/accidents/list']);
  }

  goToForm(): void {
    this.router.navigate(['/check-list/accidents']);
  }

  get totalDiasPerdidos(): number {
    return this.accidents.reduce((sum, a) => sum + (a.diasPerdidosFinal || a.diasPerdidosEstimados || 0), 0);
  }
}
