import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ObraService } from '../../../services/obra.service';
import { ObraSimple, ObrasSimpleResponse } from '../../../models/obra.models';
import { UserContextService } from '../../../../../core/services/user-context.service';
import { CustomSelectComponent, SelectOption } from '../../../../../shared/controls/custom-select/custom-select.component';

@Component({
  selector: 'app-sstma-inspection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CustomSelectComponent
  ],
  templateUrl: './sstma-inspection.component.html',
  styleUrl: './sstma-inspection.component.scss'
})
export class SstmaInspectionComponent implements OnInit {
  obrea: string = '';
  indicator: string = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  isLoading = false;

  // For the custom select components
  obraOptions: SelectOption[] = [];
  indicatorOptions: SelectOption[] = [];
  
  // Original data from API
  obras: ObraSimple[] = [];
  indicators = [
    'Tipo de Riesgo',
    'Usuario',
    'Potencial de Gravedad',
    'Empresa Inarco / SC'
  ];
  
  constructor(
    private obraService: ObraService,
    private userContextService: UserContextService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadObras();
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
   * Load obras for the current user
   */
  loadObras(): void {
    this.isLoading = true;
    
    // Get user ID from localStorage
    const userId = this.userContextService.getUserId();
    
    if (userId) {
      this.obraService.getObrasByUser(userId).subscribe({
        next: (response) => {
          if (response.codigo === 0 && response.data) {
            // Cast data to ObraSimple[] since we know the response type
            this.obras = response.data as ObraSimple[];
            
            // Convert to SelectOption format for custom-select
            this.obraOptions = this.obras.map(obra => ({
              value: obra.IdObra,
              label: obra.Obra
            }));
            
            // Add a default empty option
            this.obraOptions.unshift({
              value: '',
              label: 'Seleccione...'
            });
          } else {
            this.showMessage(`Error: ${response.glosa}`);
          }
        },
        error: (error) => {
          console.error('Error loading obras:', error);
          this.showMessage('Error al cargar obras');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.showMessage('Usuario no identificado');
      this.isLoading = false;
    }
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
