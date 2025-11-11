import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

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
    MatFormFieldModule
  ],
  templateUrl: './accidents-statistics.component.html',
  styleUrl: './accidents-statistics.component.scss'
})
export class AccidentsStatisticsComponent implements OnInit {
  @ViewChild('severityChart') severityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChart') typeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bodyPartChart') bodyPartChartRef!: ElementRef<HTMLCanvasElement>;

  // Charts
  severityChart: Chart | null = null;
  typeChart: Chart | null = null;
  monthlyChart: Chart | null = null;
  bodyPartChart: Chart | null = null;

  // Filter
  selectedYear: number = 2024;
  years: number[] = [2022, 2023, 2024];

  // Statistics
  totalAccidents = 7;
  criticalAccidents = 2;
  activeMedicalLeaves = 4;
  averageRecoveryDays = 18;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Charts will be initialized in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    // Destroy charts to prevent memory leaks
    this.severityChart?.destroy();
    this.typeChart?.destroy();
    this.monthlyChart?.destroy();
    this.bodyPartChart?.destroy();
  }

  /**
   * Initialize all charts
   */
  initializeCharts(): void {
    this.createSeverityChart();
    this.createTypeChart();
    this.createMonthlyChart();
    this.createBodyPartChart();
  }

  /**
   * Create severity distribution chart
   */
  createSeverityChart(): void {
    const ctx = this.severityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.severityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Baja', 'Media', 'Alta', 'Crítica'],
        datasets: [{
          data: [3, 1, 2, 1],
          backgroundColor: [
            '#4caf50',
            '#ff9800',
            '#f44336',
            '#9c27b0'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Distribución por Severidad',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          }
        }
      }
    });
  }

  /**
   * Create accident type chart
   */
  createTypeChart(): void {
    const ctx = this.typeChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.typeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Leve', 'Grave', 'Incapacitante', 'Sin lesión'],
        datasets: [{
          data: [3, 2, 1, 1],
          backgroundColor: [
            '#2196f3',
            '#ff9800',
            '#f44336',
            '#4caf50'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Distribución por Tipo',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          }
        }
      }
    });
  }

  /**
   * Create monthly trend chart
   */
  createMonthlyChart(): void {
    const ctx = this.monthlyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.monthlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        datasets: [{
          label: 'Accidentes',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 4, 2],
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#ff9800',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Tendencia Mensual de Accidentes 2024',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Create body part affected chart
   */
  createBodyPartChart(): void {
    const ctx = this.bodyPartChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.bodyPartChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mano', 'Pierna', 'Espalda', 'Brazo', 'Cabeza', 'Pie'],
        datasets: [{
          label: 'Cantidad',
          data: [1, 1, 1, 1, 1, 1],
          backgroundColor: [
            '#2196f3',
            '#4caf50',
            '#ff9800',
            '#f44336',
            '#9c27b0',
            '#00bcd4'
          ],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Partes del Cuerpo Afectadas',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Update charts when year filter changes
   */
  onYearChange(): void {
    console.log('Year changed to:', this.selectedYear);
    // In a real application, fetch new data and update charts
    // For now, we'll just log the change
  }

  /**
   * Navigate back to accidents list
   */
  goToList(): void {
    this.router.navigate(['/check-list/accidents/list']);
  }

  /**
   * Export statistics report
   */
  exportReport(): void {
    console.log('Exporting statistics report...');
    // Implement export functionality
  }
}
