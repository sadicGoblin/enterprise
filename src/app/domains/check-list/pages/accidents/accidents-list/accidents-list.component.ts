import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';

interface Accident {
  id: string;
  accidentNumber: string;
  accidentDate: Date;
  workerName: string;
  workerCompany: string;
  accidentType: string;
  severity: string;
  bodyPart: string;
  status: string;
  medicalLeaveStartDate: Date | null;
  medicalLeaveEndDate: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
}

@Component({
  selector: 'app-accidents-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './accidents-list.component.html',
  styleUrl: './accidents-list.component.scss'
})
export class AccidentsListComponent implements OnInit {
  // Table columns
  displayedColumns: string[] = [
    'accidentNumber',
    'accidentDate',
    'workerName',
    'workerCompany',
    'accidentType',
    'severity',
    'bodyPart',
    'medicalLeave',
    'status',
    'actions'
  ];

  // Data source
  accidents: Accident[] = [];
  filteredAccidents: Accident[] = [];

  // Filters
  filterStatus: string = 'all';
  filterSeverity: string = 'all';
  searchText: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadMockData();
    this.applyFilters();
  }

  /**
   * Load mock accident data
   */
  loadMockData(): void {
    const today = new Date();
    
    this.accidents = [
      {
        id: '1',
        accidentNumber: 'ACC-2024-001',
        accidentDate: new Date(2024, 9, 15),
        workerName: 'Juan Pérez González',
        workerCompany: 'Constructora ABC',
        accidentType: 'Leve',
        severity: 'Baja',
        bodyPart: 'Mano derecha',
        status: 'Cerrado',
        medicalLeaveStartDate: new Date(2024, 9, 16),
        medicalLeaveEndDate: new Date(2024, 9, 25),
        daysRemaining: null,
        isExpired: true
      },
      {
        id: '2',
        accidentNumber: 'ACC-2024-002',
        accidentDate: new Date(2024, 10, 1),
        workerName: 'María Silva Rojas',
        workerCompany: 'Minera XYZ',
        accidentType: 'Grave',
        severity: 'Alta',
        bodyPart: 'Pierna izquierda',
        status: 'En investigación',
        medicalLeaveStartDate: new Date(2024, 10, 2),
        medicalLeaveEndDate: new Date(2024, 11, 15),
        daysRemaining: this.calculateDaysRemaining(new Date(2024, 11, 15)),
        isExpired: false
      },
      {
        id: '3',
        accidentNumber: 'ACC-2024-003',
        accidentDate: new Date(2024, 10, 10),
        workerName: 'Carlos Muñoz Torres',
        workerCompany: 'Constructora ABC',
        accidentType: 'Incapacitante',
        severity: 'Crítica',
        bodyPart: 'Espalda',
        status: 'En investigación',
        medicalLeaveStartDate: new Date(2024, 10, 11),
        medicalLeaveEndDate: new Date(2024, 11, 30),
        daysRemaining: this.calculateDaysRemaining(new Date(2024, 11, 30)),
        isExpired: false
      },
      {
        id: '4',
        accidentNumber: 'ACC-2024-004',
        accidentDate: new Date(2024, 10, 20),
        workerName: 'Ana Martínez López',
        workerCompany: 'Servicios Industriales',
        accidentType: 'Leve',
        severity: 'Media',
        bodyPart: 'Brazo derecho',
        status: 'Reportado',
        medicalLeaveStartDate: new Date(2024, 10, 21),
        medicalLeaveEndDate: new Date(2024, 11, 5),
        daysRemaining: this.calculateDaysRemaining(new Date(2024, 11, 5)),
        isExpired: false
      },
      {
        id: '5',
        accidentNumber: 'ACC-2024-005',
        accidentDate: new Date(2024, 10, 25),
        workerName: 'Pedro Ramírez Castro',
        workerCompany: 'Minera XYZ',
        accidentType: 'Sin lesión',
        severity: 'Baja',
        bodyPart: 'N/A',
        status: 'Cerrado',
        medicalLeaveStartDate: null,
        medicalLeaveEndDate: null,
        daysRemaining: null,
        isExpired: false
      },
      {
        id: '6',
        accidentNumber: 'ACC-2024-006',
        accidentDate: new Date(2024, 10, 28),
        workerName: 'Luis Fernández Díaz',
        workerCompany: 'Constructora ABC',
        accidentType: 'Grave',
        severity: 'Alta',
        bodyPart: 'Cabeza',
        status: 'En investigación',
        medicalLeaveStartDate: new Date(2024, 10, 29),
        medicalLeaveEndDate: new Date(2024, 11, 20),
        daysRemaining: this.calculateDaysRemaining(new Date(2024, 11, 20)),
        isExpired: false
      },
      {
        id: '7',
        accidentNumber: 'ACC-2024-007',
        accidentDate: new Date(2024, 11, 1),
        workerName: 'Carmen Vega Soto',
        workerCompany: 'Servicios Industriales',
        accidentType: 'Leve',
        severity: 'Baja',
        bodyPart: 'Pie izquierdo',
        status: 'Reportado',
        medicalLeaveStartDate: new Date(2024, 11, 2),
        medicalLeaveEndDate: new Date(2024, 11, 10),
        daysRemaining: this.calculateDaysRemaining(new Date(2024, 11, 10)),
        isExpired: false
      }
    ];
  }

  /**
   * Calculate days remaining for medical leave
   */
  calculateDaysRemaining(endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Apply filters to the accidents list
   */
  applyFilters(): void {
    this.filteredAccidents = this.accidents.filter(accident => {
      // Status filter
      if (this.filterStatus !== 'all' && accident.status !== this.filterStatus) {
        return false;
      }

      // Severity filter
      if (this.filterSeverity !== 'all' && accident.severity !== this.filterSeverity) {
        return false;
      }

      // Search text filter
      if (this.searchText) {
        const searchLower = this.searchText.toLowerCase();
        return (
          accident.accidentNumber.toLowerCase().includes(searchLower) ||
          accident.workerName.toLowerCase().includes(searchLower) ||
          accident.workerCompany.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'Baja': return 'primary';
      case 'Media': return 'accent';
      case 'Alta': return 'warn';
      case 'Crítica': return 'warn';
      default: return 'primary';
    }
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Reportado': return 'accent';
      case 'En investigación': return 'warn';
      case 'Cerrado': return 'primary';
      case 'Pendiente': return 'warn';
      default: return 'primary';
    }
  }

  /**
   * Get medical leave status text
   */
  getMedicalLeaveStatus(accident: Accident): string {
    if (!accident.medicalLeaveStartDate || !accident.medicalLeaveEndDate) {
      return 'Sin licencia';
    }

    if (accident.daysRemaining === null || accident.daysRemaining < 0) {
      return 'Vencida';
    }

    if (accident.daysRemaining === 0) {
      return 'Vence hoy';
    }

    return `${accident.daysRemaining} días restantes`;
  }

  /**
   * Get medical leave status color
   */
  getMedicalLeaveColor(accident: Accident): string {
    if (!accident.medicalLeaveStartDate || !accident.medicalLeaveEndDate) {
      return '';
    }

    if (accident.daysRemaining === null || accident.daysRemaining < 0) {
      return 'expired';
    }

    if (accident.daysRemaining <= 3) {
      return 'warning';
    }

    return 'active';
  }

  /**
   * Navigate to accident details
   */
  viewDetails(accident: Accident): void {
    console.log('View details:', accident);
    // Navigate to details page when implemented
  }

  /**
   * Navigate to edit accident
   */
  editAccident(accident: Accident): void {
    console.log('Edit accident:', accident);
    // Navigate to edit page when implemented
  }

  /**
   * Navigate to new accident form
   */
  createNewAccident(): void {
    this.router.navigate(['/check-list/accidents']);
  }

  /**
   * Navigate to statistics
   */
  viewStatistics(): void {
    this.router.navigate(['/check-list/accidents/statistics']);
  }

  /**
   * Export accidents list
   */
  exportList(): void {
    console.log('Exporting accidents list...');
    // Implement export functionality
  }

  /**
   * Get count of accidents with active medical leave
   */
  get activeMedicalLeaveCount(): number {
    return this.accidents.filter(a => 
      a.medicalLeaveStartDate && 
      a.daysRemaining !== null && 
      a.daysRemaining >= 0
    ).length;
  }

  /**
   * Get count of accidents under investigation
   */
  get investigationCount(): number {
    return this.accidents.filter(a => a.status === 'En investigación').length;
  }

  /**
   * Get count of high severity accidents
   */
  get highSeverityCount(): number {
    return this.accidents.filter(a => 
      a.severity === 'Crítica' || a.severity === 'Alta'
    ).length;
  }
}
