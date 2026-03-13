import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatTableModule,
    MatProgressSpinnerModule
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

  selectedYear: number = new Date().getFullYear();
  years: number[] = [2024, 2025, 2026];

  isLoading = true;
  totalAccidentes = 0;
  porGravedad: { Gravedad: string; Total: string }[] = [];
  porMes: { Mes: string; Total: string }[] = [];
  porRiesgo: { Riesgo: string; Total: string; NivelPeligro: string }[] = [];

  constructor(
    private router: Router,
    private accidenteService: AccidenteService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Charts initialized after data loads
  }

  ngOnDestroy(): void {
    this.gravedadChart?.destroy();
    this.tipoChart?.destroy();
    this.organismoChart?.destroy();
    this.tendenciaChart?.destroy();
  }

  loadStats(): void {
    this.isLoading = true;
    this.accidenteService.getEstadisticas().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const d = response.data;
          this.totalAccidentes = parseInt(d.total_accidentes || '0', 10);
          this.porGravedad = d.por_gravedad || [];
          this.porMes = d.por_mes || [];
          this.porRiesgo = d.por_riesgo || [];
          setTimeout(() => this.initializeCharts(), 100);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[AccidentsStatisticsComponent] Error loading stats:', err);
        this.isLoading = false;
      }
    });
  }

  initializeCharts(): void {
    this.createGravedadChart();
    this.createTendenciaChart();
  }

  createGravedadChart(): void {
    const ctx = this.gravedadChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const labels = this.porGravedad.map(g => g.Gravedad);
    const data = this.porGravedad.map(g => parseInt(g.Total, 10));
    const colorMap: Record<string, string> = {
      'Leve': '#4caf50', 'Menor': '#8bc34a', 'Importante': '#ff9800', 'Grave': '#f44336', 'Fatal': '#9c27b0'
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
          },
          datalabels: {
            color: '#ffffff',
            font: { weight: 'bold', size: 14 },
            formatter: (value: number) => value > 0 ? value : '',
            anchor: 'center',
            align: 'center',
            textShadowBlur: 4,
            textShadowColor: 'rgba(0, 0, 0, 0.5)'
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
}
