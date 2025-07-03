import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParametroService } from '../../../services/parametro.service';
import { SubParametroService } from '../../../services/sub-parametro.service';
import { ParametroItem } from '../../../models/parametro.models';

// Define a local interface for API responses
interface SelectOption {
  value: string | number;
  label: string;
  idSubParam?: number;
}

interface SubParam {
  name: string;
}

interface Param {
  name: string;
  id?: string;
  subParams: SubParam[];
}

@Component({
  selector: 'app-create-params',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-params.component.html',
  styleUrl: './create-params.component.scss',
})
export class CreateParamsComponent implements OnInit {
  paramName = '';
  subParamName = '';
  selectedParam?: Param;
  loadingSubParams = false;
  subParamError: string | null = null;

  params: Param[] = [];
  isLoading = false;
  error: string | null = null;
  
  
  subParams: SubParam[] = [];

  paramColumns = ['name', 'actions'];
  subParamColumns = ['name', 'edit', 'delete'];
  
  constructor(
    private parametroService: ParametroService,
    private subParametroService: SubParametroService
  ) {}
  
  ngOnInit(): void {
    this.loadParametros();
  }
  
  loadParametros(): void {
    this.isLoading = true;
    this.error = null;
    
    this.parametroService.getParametros().subscribe({
      next: (data) => {
        console.log('Received parameter data:', data);
        // Transform API data to our component's format
        this.params = data.map(item => ({
          id: item.IdDet,
          name: item.Nombre,
          subParams: [] // We're not loading subparams yet
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading parameters:', err);
        this.error = 'Error al cargar los parámetros. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }

  saveParam() {
    if (this.paramName) {
      this.params.push({ name: this.paramName, subParams: [] });
      this.paramName = '';
    }
  }
  

  editParam(index: number) {
    this.paramName = this.params[index].name;
    this.params.splice(index, 1);
  }

  deleteParam(index: number) {
    this.params.splice(index, 1);
  }

  saveSubParam() {
    if (this.subParamName && this.selectedParam) {
      this.selectedParam.subParams.push({ name: this.subParamName });
      this.subParamName = '';
    }
  }

  editSubParam(index: number) {
    if (this.selectedParam && index >= 0 && index < this.selectedParam.subParams.length) {
      this.subParamName = this.selectedParam.subParams[index].name;
      this.selectedParam.subParams.splice(index, 1);
    }
  }

  deleteSubParam(index: number) {
    if (this.selectedParam && index >= 0 && index < this.selectedParam.subParams.length) {
      this.selectedParam.subParams.splice(index, 1);
    }
  }
  
  /**
   * Called when a parameter is selected from the dropdown
   * Loads the sub-parameters for the selected parameter
   */
  onParameterSelected(): void {
    if (!this.selectedParam || !this.selectedParam.id) {
      return;
    }
    
    this.loadingSubParams = true;
    this.subParamError = null;
    
    const idEnt = parseInt(this.selectedParam.id, 10);
    console.log(`Loading sub-parameters for parameter ID: ${idEnt}`);
    
    this.subParametroService.getSubParametros(idEnt).subscribe({
      next: (options: SelectOption[]) => {
        console.log('Received sub-parameter data:', options);
        
        if (this.selectedParam) {
          // Transform API data to our component's format
          this.selectedParam.subParams = options.map(option => ({
            name: option.label
          }));
        }
        
        this.loadingSubParams = false;
      },
      error: (err) => {
        console.error('Error loading sub-parameters:', err);
        this.subParamError = 'Error al cargar los sub-parámetros. Por favor, intente de nuevo.';
        this.loadingSubParams = false;
        if (this.selectedParam) {
          this.selectedParam.subParams = [];
        }
      }
    });
  }
  
}
