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
import { MatDividerModule } from '@angular/material/divider';
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
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './create-params.component.html',
  styleUrls: ['./create-params.component.scss'],
})
export class CreateParamsComponent implements OnInit {
  paramName = '';
  subParamName = '';
  selectedParam?: Param;
  loadingSubParams = false;
  subParamError: string | null = null;
  editingParamIndex: number = -1; // -1 indica que no se está editando ningún parámetro
  editingSubParamIndex: number = -1; // -1 indica que no se está editando ningún sub-parámetro

  params: Param[] = [];
  isLoading = false;
  error: string | null = null;

  subParams: SubParam[] = [];

  paramColumns = ['name', 'edit', 'delete'];
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
        this.params = data.map((item) => ({
          id: item.IdDet,
          name: item.Nombre,
          subParams: [], // We're not loading subparams yet
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading parameters:', err);
        this.error =
          'Error al cargar los parámetros. Por favor, intente de nuevo.';
        this.isLoading = false;
      },
    });
  }

  clearParamForm() {
    this.paramName = '';
    this.editingParamIndex = -1; // Resetear el estado de edición
  }

  clearSubParamForm() {
    this.subParamName = '';
    this.editingSubParamIndex = -1; // Resetear el estado de edición
  }

  saveParam() {
    if (this.paramName) {
      if (this.editingParamIndex >= 0) {
        // Actualizar parámetro existente
        console.log(`Actualizando parámetro en índice ${this.editingParamIndex} con nombre: ${this.paramName}`);
        this.params[this.editingParamIndex].name = this.paramName;
        this.editingParamIndex = -1; // Resetear el estado de edición
      } else {
        // Crear nuevo parámetro
        console.log(`Creando nuevo parámetro: ${this.paramName}`);
        this.params.push({ name: this.paramName, subParams: [] });
      }
      this.paramName = '';
    }
  }

  editParam(index: number) {
    // Almacenar el parámetro seleccionado sin eliminarlo
    this.paramName = this.params[index].name;
    this.editingParamIndex = index; // Guardamos el índice para actualizar más tarde
    console.log(`Editando parámetro: ${this.paramName}, índice: ${this.editingParamIndex}`);
  }

  deleteParam(index: number) {
    this.params.splice(index, 1);
  }

  saveSubParam() {
    if (this.subParamName && this.selectedParam) {
      if (this.editingSubParamIndex >= 0) {
        // Actualizar sub-parámetro existente
        console.log(`Actualizando sub-parámetro en índice ${this.editingSubParamIndex} con nombre: ${this.subParamName}`);
        // Aquí iría la llamada a la API para actualizar
        this.selectedParam.subParams[this.editingSubParamIndex].name = this.subParamName;
        this.editingSubParamIndex = -1; // Resetear el estado de edición
      } else {
        // Crear nuevo sub-parámetro
        console.log(`Creando nuevo sub-parámetro: ${this.subParamName}`);
        // Aquí iría la llamada a la API para crear
        this.selectedParam.subParams.push({ name: this.subParamName });
      }
      this.subParamName = '';
    }
  }

  editSubParam(index: number) {
    if (
      this.selectedParam &&
      index >= 0 &&
      index < this.selectedParam.subParams.length
    ) {
      this.subParamName = this.selectedParam.subParams[index].name;
      this.editingSubParamIndex = index; // Guardamos el índice para actualizar más tarde
      console.log(`Editando sub-parámetro: ${this.subParamName}, índice: ${this.editingSubParamIndex}`);
    }
  }

  deleteSubParam(index: number) {
    if (
      this.selectedParam &&
      index >= 0 &&
      index < this.selectedParam.subParams.length
    ) {
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
          this.selectedParam.subParams = options.map((option) => ({
            name: option.label,
          }));
        }

        this.loadingSubParams = false;
      },
      error: (err) => {
        console.error('Error loading sub-parameters:', err);
        this.subParamError =
          'Error al cargar los sub-parámetros. Por favor, intente de nuevo.';
        this.loadingSubParams = false;
        if (this.selectedParam) {
          this.selectedParam.subParams = [];
        }
      },
    });
  }
}
