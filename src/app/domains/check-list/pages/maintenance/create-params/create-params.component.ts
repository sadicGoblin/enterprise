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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ParametroService } from '../../../services/parametro.service';
import { SubParametroService } from '../../../services/sub-parametro.service';
import { ParametroItem } from '../../../models/parametro.models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

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
    MatSnackBarModule,
    MatDialogModule,
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
  filteredParams: Param[] = []; // Para los resultados filtrados
  searchQuery: string = ''; // Para la búsqueda
  isLoading = false;
  error: string | null = null;

  subParams: SubParam[] = [];

  paramColumns = ['name', 'edit', 'delete'];
  subParamColumns = ['name', 'edit', 'delete'];

  constructor(
    private parametroService: ParametroService,
    private subParametroService: SubParametroService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
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
        // Actualizar también los parámetros filtrados
        this.filteredParams = [...this.params];
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
        // Crear nuevo parámetro mediante la API
        const idCab = 5; // Valor fijo para gabinete según el ejemplo
        this.isLoading = true;
        
        // Imprimir el request body que se enviará a la API (para verificar)
        const requestBody = {
          "caso": "DetalleCrea",
          "idDet": 0,
          "idCab": idCab,
          "nombre": this.paramName,
          "alias": "",
          "codigo": "",
          "idPeriocidad": 0,
          "periocidad": null,
          "idCategoria": 0,
          "idParam": 0
        };
        
        console.log('Request para crear parámetro:', JSON.stringify(requestBody, null, 2));
        
        // Llamar al servicio para crear el parámetro
        this.parametroService.createParametro(this.paramName, idCab)
          .subscribe({
            next: (response) => {
              console.log('Respuesta de API al crear parámetro:', response);
              if (response.success) {
                // Si la respuesta es exitosa, agregar el nuevo parámetro a la lista local
                // y refrescar la lista de parámetros desde el servidor
                console.log(`Parámetro "${this.paramName}" creado correctamente`);
                this.loadParametros(); // Recargar todos los parámetros
                
                // Mostrar confirmación con SnackBar
                this.snackBar.open(
                  `Parámetro "${this.paramName}" creado correctamente`, 
                  'Cerrar', 
                  { duration: 5000, panelClass: ['success-snackbar'] }
                );
              } else {
                console.error('Error al crear el parámetro:', response.message || 'Error desconocido');
                this.error = `Error al crear el parámetro: ${response.message || 'Error desconocido'}`;
              }
              this.isLoading = false;
              this.paramName = ''; // Limpiar el formulario
            },
            error: (err) => {
              console.error('Error en la comunicación con el servidor:', err);
              this.error = 'Error en la comunicación con el servidor. Por favor, intente de nuevo.';
              this.isLoading = false;
            }
          });
      }
    }
  }

  editParam(index: number) {
    // Almacenar el parámetro seleccionado sin eliminarlo
    this.paramName = this.params[index].name;
    this.editingParamIndex = index; // Guardamos el índice para actualizar más tarde
    console.log(`Editando parámetro: ${this.paramName}, índice: ${this.editingParamIndex}`);
  }

  deleteParam(index: number) {
    // Usar el array filtrado (filteredParams) en lugar del array original (params)
    // para asegurar que se elimina el parámetro correcto después de filtrar
    const param = this.filteredParams[index];
    if (!param) {
      this.snackBar.open('No se puede eliminar: Parámetro no encontrado', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Asegurar que el ID es un número válido
    let idDet: number;
    if (typeof param.id === 'string') {
      idDet = parseInt(param.id, 10);
    } else if (typeof param.id === 'number') {
      idDet = param.id;
    } else {
      this.snackBar.open('No se puede eliminar: ID de parámetro no válido', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    if (isNaN(idDet)) {
      this.snackBar.open('No se puede eliminar: ID de parámetro no válido', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: `¿Está seguro de que desea eliminar el parámetro "${param.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      } as ConfirmDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        
        // Imprimir el request body que se enviará a la API (para verificar)
        console.log(`Eliminando parámetro con ID: ${idDet}`);
        
        this.parametroService.deleteParametro(idDet)
          .subscribe({
            next: (response) => {
              console.log('Respuesta de API al eliminar parámetro:', response);
              
              if (response.success) {
                // Encontrar el índice correcto en el array original
                const originalIndex = this.params.findIndex(p => p.id === param.id);
                if (originalIndex !== -1) {
                  // Eliminar el parámetro del arreglo original
                  this.params.splice(originalIndex, 1);
                }
                // Eliminar el parámetro del arreglo filtrado
                this.filteredParams.splice(index, 1);
                
                // Mostrar mensaje de éxito
                this.snackBar.open(
                  `Parámetro "${param.name}" eliminado correctamente`, 
                  'Cerrar', 
                  { duration: 5000, panelClass: ['success-snackbar'] }
                );
              } else {
                // Mostrar mensaje de error
                this.snackBar.open(
                  `Error al eliminar el parámetro: ${response.message || 'Error desconocido'}`, 
                  'Cerrar', 
                  { duration: 5000, panelClass: ['error-snackbar'] }
                );
              }
              
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error al eliminar parámetro:', err);
              this.snackBar.open('Error en la comunicación con el servidor', 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.isLoading = false;
            }
          });
      }
    });
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

  /**
   * Filtra los parámetros según el término de búsqueda
   */
  filterParams(): void {
    if (!this.searchQuery) {
      // Si no hay búsqueda, mostrar todos los parámetros
      this.filteredParams = [...this.params];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredParams = this.params.filter(param => 
      param.name.toLowerCase().includes(query)
    );
  }
}
