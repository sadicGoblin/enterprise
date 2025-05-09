import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartType,
} from 'chart.js';
import { DashboardTableComponent } from '../../components/dashboard-table/dashboard-table.component';

@Component({
  selector: 'app-check-list-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, NgChartsModule, DashboardTableComponent],
  templateUrl: './check-list-dashboard.component.html',
  styleUrl: './check-list-dashboard.component.scss',
})
export class CheckListDashboardComponent  {
  metrics = [
    {
      label: 'CHECKLIST DISTRIBUCIONES',
      value: 65,
      change: 4.6,
      color: '#f26522',
    },
    {
      label: 'CHECKLIST AREA DE PERSONA Y BAÑOS',
      value: 48,
      change: -2.3,
      color: '#00c853',
    },
    {
      label: 'ENFERRADURA',
      value: '$130',
      change: 10,
      color: '#8e24aa',
    },
    {
      label: 'OTROS',
      value: '7,932',
      change: -9,
      color: '#d500f9',
    },
  ];


  donutChartLabels = ['Distribuciones', 'Personas', 'Enfierradura', 'Otros'];
  donutChartData = {
    labels: ['Distribuciones', 'Personas', 'Enfierradura', 'Otros'],
    datasets: [
      {
        data: [1200, 900, 800, 1686],
        backgroundColor: ['#6a1b9a', '#f4511e', '#ffeb3b', '#42a5f5'],
        hoverBackgroundColor: ['#7b1fa2', '#fb8c00', '#ffee58', '#64b5f6']
      }
    ]
  };
    donutChartColors = [{ backgroundColor: ['#6a1b9a', '#f4511e', '#ffeb3b', '#42a5f5'] }];
  donutChartType: ChartType = 'doughnut';

  lineChartData: ChartConfiguration['data'] = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep'],
    datasets: [
      {
        label: 'PLAN',
        data: [0, 60, 90, 100, 120, 160, 200, 250, 290],
        borderColor: '#8e24aa',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'PROGRAMA',
        data: [100, 200, 50, 180, 300, 100, 150, 230, 180],
        borderColor: '#00bcd4',
        fill: false,
        tension: 0.4,
      },
    ],
  };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };
  lineChartType: ChartType = 'line';
}
