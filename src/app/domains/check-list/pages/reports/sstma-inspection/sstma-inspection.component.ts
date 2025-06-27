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
import { ObraService } from '../../../services/obra.service';
import { UserContextService } from '../../../../../core/services/user-context.service';

// Interface para las obras
export interface ObraSimple {
  IdObra: string;
  Obra: string;
}

@Component({
  selector: 'app-sstma-inspection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    CustomSelectComponent
  ],
  templateUrl: './sstma-inspection.component.html',
  styleUrl: './sstma-inspection.component.scss'
})
export class SstmaInspectionComponent implements OnInit {
  // Control for the form visibility
  isLoading = false;

  // Form controls
  projectControl = new FormControl('');
  indicator = new FormControl('');
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // API Parameters for obra selection
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiRequestBody: any;
  projectOptionValueKey = 'IdObra';
  projectOptionLabelKey = 'Obra';

  // Parameter type for the custom select
  parameterTypeCustomApi = ParameterType.CUSTOM_API;

  // For the custom select components
  obraOptions: SelectOption[] = [];
  indicatorOptions: SelectOption[] = [];
  
  // Original data from API
  obras: ObraSimple[] = [];
  indicators = [
    'Tipo de Riesgo',
    'Usuario',
    'Potencial de Gravedad',
    'Empresa INARCO/SC'
  ];
  
  constructor(
    private http: HttpClient,
    private obraService: ObraService,
    private userContextService: UserContextService,
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
   * Reset form controls
   */
  resetForm(): void {
    this.projectControl.reset('');
    this.indicator.reset('');
    this.fromDate = null;
    this.toDate = null;
  }

  /**
   * Search inspection reports with current filters
   */
  buscarReportes(): void {
    console.log('Searching with filters:', {
      proyecto: this.projectControl.value,
      indicador: this.indicator.value,
      fechaDesde: this.fromDate,
      fechaHasta: this.toDate
    });
    // Aquí iría la lógica para buscar reportes con los filtros aplicados
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
