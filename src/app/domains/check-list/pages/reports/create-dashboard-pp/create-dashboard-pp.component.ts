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
import { MatSnackBar } from '@angular/material/snack-bar';

import { HttpClient } from '@angular/common/http';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { UserContextService } from '../../../../../core/services/user-context.service';

// Definición de interface para las obras/proyectos
export interface ObraSimple {
  IdObra: string;
  Obra: string;
}

@Component({
  selector: 'app-create-dashboard-pp',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CustomSelectComponent
  ],
  templateUrl: './create-dashboard-pp.component.html',
  styleUrls: ['./create-dashboard-pp.component.scss']
})
export class CreateDashboardPpComponent implements OnInit {
  // Control para el select de proyectos
  projectControl = new FormControl<string>('');
  selectedProject: ObraSimple | null = null;
  
  // Fecha periodo
  startPeriod: Date | null = null;
  endPeriod: Date | null = null;
  
  // Estados de UI
  isLoading = false;
  
  // Parámetros para app-custom-select
  parameterTypeCustomApi = ParameterType.CUSTOM_API; // Tipo de parámetro para API personalizada
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectOptionValueKey = 'IdObra';
  projectOptionLabelKey = 'Obra';
  
  // RequestBody para la API
  projectApiRequestBody = {
    caso: 'Consulta',
    idObra: 0,
    idUsuario: '478' // Valor por defecto
  };

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    // Get user id from localStorage or default to 478
    const userId = localStorage.getItem('id_usuario') || '478';
    
    // Setup API request body with the user ID
    this.projectApiRequestBody = {
      caso: 'Consulta',
      idObra: 0,
      idUsuario: userId
    };
  }
  
  /**
   * Handle project selection change
   * @param event Selection event
   */
  onProjectSelectionChange(event: any): void {
    this.selectedProject = event;
    console.log('Selected Project:', event);
  }
  
  /**
   * Reset the form
   */
  resetForm(): void {
    this.projectControl.reset();
    this.startPeriod = null;
    this.endPeriod = null;
  }
  
  /**
   * Generate the dashboard report
   */
  generateDashboard(): void {
    // Validar que haya un proyecto seleccionado
    if (!this.selectedProject) {
      this.snackBar.open('Debe seleccionar una obra para generar el dashboard', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    this.isLoading = true;
    
    // TODO: Implement the API call to generate the dashboard
    console.log('Generating dashboard with:', {
      project: this.selectedProject,
      startDate: this.startPeriod,
      endDate: this.endPeriod
    });
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.snackBar.open(`Dashboard generado para ${this.selectedProject?.Obra}`, 'OK', {
        duration: 3000
      });
    }, 1500);
  }
}
