import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { HttpClient } from '@angular/common/http';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CustomSelectComponent
  ],
  templateUrl: './incident-report.component.html',
  styleUrl: './incident-report.component.scss'
})
export class IncidentReportComponent implements OnInit {
  // Estado de carga
  isLoading = false;

  // Form controls
  projectControl = new FormControl('');
  indicatorControl = new FormControl('');
  startDate: Date | null = null;
  endDate: Date | null = null;

  // API Parameters for obra selection
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiRequestBody: { caso: string; idObra: number; idUsuario: number } = {
    caso: "Consulta",
    idObra: 0, // For fetching all projects
    idUsuario: 0 // Valor por defecto, se actualizará en ngOnInit
  };
  projectOptionValueKey = 'IdObra';
  projectOptionLabelKey = 'Obra';
  
  // Parameter type for the custom select
  parameterTypeCustomApi = ParameterType.CUSTOM_API;

  // Options for the indicator dropdown
  indicatorOptions: SelectOption[] = [];

  indicators = [
    'Potencial de Gravedad',
    'Tipo Incidente',
    'Parte Interesada Afectada',
    'Originado Por'
  ];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupApiRequest();
    this.initializeSelectOptions();
  }

  /**
   * Initialize the indicator select options
   */
  initializeSelectOptions(): void {
    // Add default option
    this.indicatorOptions = [{ value: '', label: 'Seleccione...' }];
    
    // Convert string array to SelectOption array
    this.indicators.forEach(indicator => {
      this.indicatorOptions.push({
        value: indicator,
        label: indicator
      });
    });
  }

  /**
   * Setup API request with user ID from localStorage
   */
  setupApiRequest(): void {
    // Get user ID from localStorage or use default
    let userId: number;
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userId = userData.id || 478; // Use 478 as fallback if id not found
      } else {
        userId = 478; // Default fallback
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      userId = 478; // Default fallback on error
    }

    // Setup the API request body
    this.projectApiRequestBody = {
      caso: 'Consulta',
      idObra: 0,
      idUsuario: userId
    };
    
    console.log('API Request Body:', this.projectApiRequestBody);
  }
  
  /**
   * Handle project selection change
   */
  onProjectSelectionChange(selectedProject: SelectOption | null): void {
    if (selectedProject && selectedProject.value) {
      console.log('Project selected:', selectedProject.value);
    } else {
      console.log('Project selection cleared');
    }
  }

  /**
   * Handle indicator selection change
   */
  onIndicatorSelectionChange(selectedIndicator: SelectOption | null): void {
    if (selectedIndicator && selectedIndicator.value) {
      console.log('Indicator selected:', selectedIndicator.value);
    } else {
      console.log('Indicator selection cleared');
    }
  }

  /**
   * Reset form controls
   */
  resetForm(): void {
    this.projectControl.reset('');
    this.indicatorControl.reset('');
    this.startDate = null;
    this.endDate = null;
  }

  /**
   * Generate incident report with current filters
   */
  generateReport(): void {
    console.log('Generating report with filters:', {
      project: this.projectControl.value,
      indicator: this.indicatorControl.value,
      startDate: this.startDate,
      endDate: this.endDate
    });
    // Aquí iría la lógica para generar el reporte con los filtros aplicados
  }

  /**
   * Show a snackbar message
   */
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
