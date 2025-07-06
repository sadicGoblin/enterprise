import { Component, OnInit, AfterViewInit } from '@angular/core';
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
  originalIndex?: number; // Índice original en el array de subparámetros
}

interface Param {
  name: string;
  id?: string;
  subParams: SubParam[];
  originalIndex?: number; // Índice original para rastreo después del filtrado
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
export class CreateParamsComponent implements OnInit, AfterViewInit {
  // Loading and error states
  isLoading: boolean = true;
  loadingSubParams: boolean = false;
  error: string | null = null;
  subParamError: string | null = null;
  
  // Form fields
  paramName: string = '';
  searchQuery: string = '';
  subParamSearchQuery: string = '';
  editingParamIndex: number = -1;
  
  // Data structure
  params: Param[] = [];
  filteredParams: Param[] = [];
  
  // Selected parameter and sub-parameter states
  selectedParam: Param | null = null;
  selectedParamOptions: SelectOption[] = [];
  filteredSubParams: SubParam[] = [];
  subParamName: string = '';
  editingSubParamIndex: number = -1;
  editingSubParamId: number = -1;

  subParams: SubParam[] = [];

  paramColumns = ['name', 'edit', 'delete'];
  subParamColumns = ['name', 'edit', 'delete'];

  // Original names for editing reference
  originalParamName: string = '';
  originalSubParamName: string = '';

  constructor(
    private parametroService: ParametroService,
    private subParametroService: SubParametroService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadParametros();
    // Inicializar el array filtrado
    this.filteredSubParams = [];
  }

  ngAfterViewInit(): void {
    console.log('CreateParamsComponent view initialized');
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
    this.editingParamIndex = -1;
    this.originalParamName = '';
  }

  clearSubParamForm() {
    this.subParamName = '';
    this.editingSubParamIndex = -1;
    this.originalSubParamName = '';
    this.editingSubParamId = -1;
  }
  
  /**
   * Filtra los sub-parámetros según el término de búsqueda
   */
  filterSubParams(): void {
    if (!this.selectedParam || !this.selectedParam.subParams) {
      this.filteredSubParams = [];
      return;
    }
    
    // Asegurarse de que cada sub-parámetro tenga su índice original
    const subParamsWithIndex = this.selectedParam.subParams.map((subParam, index) => ({
      ...subParam,
      originalIndex: index
    }));
    
    if (!this.subParamSearchQuery) {
      // Si no hay búsqueda, mostrar todos los sub-parámetros
      this.filteredSubParams = [...subParamsWithIndex];
      return;
    }
    
    const query = this.subParamSearchQuery.toLowerCase().trim();
    this.filteredSubParams = subParamsWithIndex.filter(subParam => 
      subParam.name.toLowerCase().includes(query)
    );
  }

  /**
   * Muestra un diálogo de confirmación para actualizar un parámetro
   */
  confirmSaveParam() {
    // Si estamos editando un parámetro existente, mostrar confirmación
    if (this.editingParamIndex >= 0) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirmar actualización',
          message: `¿Está seguro que desea actualizar el parámetro "${this.originalParamName}" a "${this.paramName}"?`,
          confirmText: 'Actualizar',
          cancelText: 'Cancelar'
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.saveParam();
        }
      });
    } else {
      // Si es nuevo, guardar directamente
      this.saveParam();
    }
  }

  saveParam() {
    if (this.paramName) {
      if (this.editingParamIndex >= 0) {
        // Actualizar parámetro existente mediante la API
        this.isLoading = true;
        
        // Obtener el parámetro actual para obtener su ID
        const paramToUpdate = this.params[this.editingParamIndex];
        
        // Verificar que el ID existe y es válido
        if (!paramToUpdate || !paramToUpdate.id) {
          this.snackBar.open(
            'No se puede actualizar: ID de parámetro no válido', 
            'Cerrar', 
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
          return;
        }
        
        // Convertir ID a número
        let idDet: number;
        if (typeof paramToUpdate.id === 'string') {
          idDet = parseInt(paramToUpdate.id, 10);
        } else if (typeof paramToUpdate.id === 'number') {
          idDet = paramToUpdate.id;
        } else {
          this.snackBar.open(
            'No se puede actualizar: ID de parámetro no válido', 
            'Cerrar', 
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
          return;
        }
        
        // Preparar el request body para actualizar el parámetro
        const idCab = 5; // Valor fijo para gabinete según el ejemplo
        const requestBody = {
          "caso": "DetalleActualiza",
          "idDet": idDet,
          "idCab": idCab,
          "nombre": this.paramName,
          "alias": "",
          "codigo": "",
          "idPeriocidad": 0,
          "periocidad": "Sin Acceso",
          "idCategoria": 0,
          "idParam": 0
        };
        
        console.log('Request para actualizar parámetro:', JSON.stringify(requestBody, null, 2));
        
        // Llamar al servicio para actualizar el parámetro
        this.parametroService.updateParametro(requestBody).subscribe({
          next: (response: any) => {
            console.log('Respuesta de API al actualizar parámetro:', response);
            
            if (response && response.success) {
              // Actualizar el nombre del parámetro localmente
              this.params[this.editingParamIndex].name = this.paramName;
              
              // Actualizar también en los parámetros filtrados
              this.filterParams();
              
              // Mostrar mensaje de éxito
              this.snackBar.open(
                `Parámetro "${this.originalParamName}" actualizado correctamente a "${this.paramName}"`, 
                'Cerrar', 
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
            } else {
              // Mostrar mensaje de error
              this.snackBar.open(
                `Error al actualizar el parámetro: ${response?.message || 'Error desconocido'}`, 
                'Cerrar', 
                { duration: 5000, panelClass: ['error-snackbar'] }
              );
            }
            
            this.isLoading = false;
            this.paramName = ''; // Limpiar el formulario
            this.editingParamIndex = -1; // Resetear el estado de edición
          },
          error: (err: any) => {
            console.error('Error al actualizar parámetro:', err);
            this.snackBar.open(
              'Error en la comunicación con el servidor', 
              'Cerrar', 
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            this.isLoading = false;
            this.editingParamIndex = -1; // Resetear el estado de edición
          }
        });
      
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

  editParam(index: number, originalIndex?: number) {
    // Si se proporciona el índice original (desde la tabla filtrada), usarlo
    const actualIndex = originalIndex !== undefined ? originalIndex : index;
    
    if (actualIndex >= 0 && actualIndex < this.params.length) {
      this.paramName = this.params[actualIndex].name;
      this.originalParamName = this.params[actualIndex].name;
      this.editingParamIndex = actualIndex;
    }
  }

  deleteParam(index: number, originalIndex?: number) {
    // Obtener el parámetro del array filtrado
    const param = this.filteredParams[index];
    if (!param) {
      this.snackBar.open('No se puede eliminar: Parámetro no encontrado', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Usar el índice original si se proporciona, de lo contrario usar el original guardado en el parámetro
    const actualIndex = originalIndex !== undefined ? originalIndex : 
                         param.originalIndex !== undefined ? param.originalIndex : index;

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
                // Eliminar el parámetro del arreglo original usando el índice actual correcto
                this.params.splice(actualIndex, 1);
                
                // Eliminar el parámetro del arreglo filtrado
                this.filteredParams.splice(index, 1);
                
                // Actualizar los índices originales recalculando el filtro
                this.filterParams();
                
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

  /**
   * Guarda un sub-parámetro (crear nuevo o actualizar existente)
   */
  /**
   * Muestra un diálogo de confirmación para actualizar un sub-parámetro
   */
  confirmSaveSubParam() {
    // Si estamos editando un sub-parámetro existente, mostrar confirmación
    if (this.editingSubParamIndex >= 0) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirmar actualización',
          message: `¿Está seguro que desea actualizar el sub-parámetro "${this.originalSubParamName}" a "${this.subParamName}"?`,
          confirmText: 'Actualizar',
          cancelText: 'Cancelar'
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.saveSubParam();
        }
      });
    } else {
      // Si es nuevo, guardar directamente
      this.saveSubParam();
    }
  }

  saveSubParam() {
    if (!this.subParamName) {
      this.snackBar.open('El nombre del sub-parámetro es obligatorio', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (!this.selectedParam || !this.selectedParam.id) {
      this.snackBar.open('Debe seleccionar un parámetro', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Mostrar indicador de carga
    this.loadingSubParams = true;

    // Convertir el ID del parámetro a número
    const idDet = typeof this.selectedParam!.id === 'string' ? 
      parseInt(this.selectedParam!.id, 10) : 
      this.selectedParam!.id;

    // Verificar que el ID es válido
    if (isNaN(idDet)) {
      this.snackBar.open('ID de parámetro no válido', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.loadingSubParams = false;
      return;
    }

    if (this.editingSubParamIndex >= 0 && this.editingSubParamId > 0) {
      // Actualizar sub-parámetro existente
      console.log(`Actualizando sub-parámetro ID ${this.editingSubParamId} con nombre: ${this.subParamName}`);
      
      // Llamar al servicio para actualizar el sub-parámetro
      this.subParametroService.updateSubParametro(this.editingSubParamId, idDet, this.subParamName)
        .subscribe({
          next: (response) => {
            console.log('Respuesta de API al actualizar sub-parámetro:', response);
            
            if (response && response.success) {
              // Mostrar mensaje de éxito
              this.snackBar.open(
                `Sub-parámetro "${this.subParamName}" actualizado correctamente`, 
                'Cerrar', 
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
              
              // Actualizar el nombre en la lista local temporalmente para feedback inmediato
              if (this.selectedParam && this.selectedParam.subParams) {
                this.selectedParam.subParams[this.editingSubParamIndex].name = this.subParamName;
                
                // Actualizar también en las opciones originales
                const optIndex = this.selectedParamOptions.findIndex(
                  (opt: SelectOption) => typeof opt.value === 'number' && opt.value === this.editingSubParamId
                );
                if (optIndex >= 0) {
                  this.selectedParamOptions[optIndex].label = this.subParamName;
                }
              }
              
              // Recargar los datos desde el servidor para asegurar sincronización completa
               this.onParameterSelected();
              
              // Resetear el estado de edición
              this.subParamName = '';
              this.editingSubParamIndex = -1;
              this.editingSubParamId = -1;
              this.filterSubParams();
            } else {
              // Mostrar mensaje de error
              this.snackBar.open(
                `Error al actualizar el sub-parámetro: ${response.message || 'Error desconocido'}`, 
                'Cerrar', 
                { duration: 5000, panelClass: ['error-snackbar'] }
              );
            }
            
            this.loadingSubParams = false;
          },
          error: (err) => {
            console.error('Error al actualizar sub-parámetro:', err);
            this.snackBar.open('Error en la comunicación con el servidor', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.loadingSubParams = false;
          }
        });
    } else {
      // Crear nuevo sub-parámetro
      console.log(`Creando nuevo sub-parámetro: ${this.subParamName} para parámetro ID: ${this.selectedParam!.id}`);
      
      // Imprimir el request body que se enviará a la API (para verificar)
      console.log('Request body para crear sub-parámetro:', {
        caso: 'SubParametroCrea',
        idSubParam: 0,
        idDet: idDet,
        nombre: this.subParamName
      });

      // Llamar al servicio para crear el sub-parámetro
      this.subParametroService.createSubParametro(this.subParamName, idDet)
        .subscribe({
          next: (response) => {
            console.log('Respuesta de API al crear sub-parámetro:', response);
            
            if (response && response.success) {
              // Mostrar mensaje de éxito
              this.snackBar.open(
                `Sub-parámetro "${this.subParamName}" creado correctamente`, 
                'Cerrar', 
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
              
              // Recargar los sub-parámetros para el parámetro seleccionado
               this.onParameterSelected();
            } else {
              // Mostrar mensaje de error
              this.snackBar.open(
                `Error al crear el sub-parámetro: ${response.message || 'Error desconocido'}`, 
                'Cerrar', 
                { duration: 5000, panelClass: ['error-snackbar'] }
              );
            }
            
            // Limpiar el formulario
            this.subParamName = '';
            this.loadingSubParams = false;
            this.filterSubParams();
          },
          error: (err) => {
            console.error('Error al crear sub-parámetro:', err);
            this.snackBar.open('Error en la comunicación con el servidor', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.loadingSubParams = false;
          }
        });
    }
  }

  /**
   * Prepara el formulario para editar un sub-parámetro
   * @param index Índice del sub-parámetro en la lista filtrada
   * @param originalIndex Índice original del subparámetro en la lista sin filtrar
   */
  editSubParam(index: number, originalIndex?: number): void {
    if (!this.selectedParam || !this.selectedParam.subParams) {
      return;
    }
    
    // Si se proporciona el índice original (desde la tabla filtrada), usarlo
    const actualIndex = originalIndex !== undefined ? originalIndex : index;
    
    this.editingSubParamIndex = actualIndex;
    this.subParamName = this.selectedParam.subParams[actualIndex].name;
    this.originalSubParamName = this.selectedParam.subParams[actualIndex].name;

    // Get the ID of the sub-parameter from the original array
    if (this.selectedParamOptions && this.selectedParamOptions[actualIndex]) {
      const value = this.selectedParamOptions[actualIndex].value;
      this.editingSubParamId = typeof value === 'string' ? parseInt(value, 10) : value;
    } else {
      console.error('Could not find ID for sub-parameter at index', actualIndex);
    }
    
    console.log(`Editing sub-param: ${this.subParamName} with ID: ${this.editingSubParamId}`);
  }

  /**
   * Elimina un subparámetro mostrando un diálogo de confirmación primero
   * @param index Índice del subparámetro a eliminar
   * @param originalIndex Índice original del subparámetro en la lista sin filtrar
   */
  deleteSubParam(index: number, originalIndex?: number): void {
    if (!this.selectedParam || !this.selectedParam.subParams) {
      return;
    }
    
    // Si se proporciona el índice original (desde la tabla filtrada), usarlo
    const actualIndex = originalIndex !== undefined ? originalIndex : index;
    
    // Obtener el subparámetro a eliminar
    const subParam = this.selectedParam.subParams[actualIndex];
    
    if (!subParam) {
      this.snackBar.open('No se pudo encontrar el sub-parámetro', 'Cerrar',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      return;
    }
    
    // Mostrar un diálogo de confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: `¿Está seguro de que desea eliminar el sub-parámetro "${subParam.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      } as ConfirmDialogData
    });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // Buscar el ID del subparámetro en las opciones originales
          // (Es necesario porque nuestro array subParams solo tiene nombres, no IDs)
          const foundOption = this.selectedParamOptions.find((opt: SelectOption) => opt.label === subParam.name);
          if (!foundOption || foundOption.value === undefined) {
            this.snackBar.open(
              'No se pudo encontrar el ID del sub-parámetro para eliminarlo',
              'Cerrar',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            return;
          }
          
          // Convertir el ID a número
          const idSubParam = typeof foundOption.value === 'string' ? 
            parseInt(foundOption.value, 10) : 
            foundOption.value;
            
          // Verificar que el ID es válido
          if (isNaN(idSubParam)) {
            this.snackBar.open(
              'ID del sub-parámetro no válido',
              'Cerrar',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            return;
          }

          // Mostrar indicador de carga
          this.loadingSubParams = true;
          
          // Llamar al servicio para eliminar
          this.subParametroService.deleteSubParametro(idSubParam).subscribe({
            next: (response: any) => {
              if (response && response.success) {
                // Mostrar mensaje de éxito
                this.snackBar.open(
                  `Sub-parámetro "${subParam.name}" eliminado correctamente`,
                  'Cerrar',
                  { duration: 5000, panelClass: ['success-snackbar'] }
                );
                
                // Actualizar la lista de sub-parámetros
                if (this.selectedParam && this.selectedParam.subParams) {
                  this.selectedParam.subParams.splice(actualIndex, 1);
                  
                  // Actualizar también la lista filtrada
                  this.filterSubParams();
                }
                
                // También eliminar de las opciones originales
                const optIndex = this.selectedParamOptions.findIndex((opt: SelectOption) => opt.label === subParam.name);
                if (optIndex >= 0) {
                  this.selectedParamOptions.splice(optIndex, 1);
                }
              } else {
                // Mostrar mensaje de error
                this.snackBar.open(
                  `Error al eliminar el sub-parámetro: ${response?.message || 'Error desconocido'}`,
                  'Cerrar',
                  { duration: 5000, panelClass: ['error-snackbar'] }
                );
              }
              this.loadingSubParams = false;
            },
            error: (err: any) => {
              console.error('Error al eliminar sub-parámetro:', err);
              this.snackBar.open(
                'Error en la comunicación con el servidor',
                'Cerrar',
                { duration: 5000, panelClass: ['error-snackbar'] }
              );
              this.loadingSubParams = false;
            }
          });
        }
      });
    }
  

  onParameterSelected(): void {
    if (!this.selectedParam || !this.selectedParam.id) {
      this.filteredSubParams = [];
      return;
    }
    
    // Reiniciar el campo de búsqueda
    this.subParamSearchQuery = '';

    this.loadingSubParams = true;
    this.subParamError = null;

    const idEnt = parseInt(this.selectedParam.id, 10);
    console.log(`Loading sub-parameters for parameter ID: ${idEnt}`);

    this.subParametroService.getSubParametros(idEnt).subscribe({
      next: (options: SelectOption[]) => {
        console.log('Received sub-parameter data:', options);

        // Guardar las opciones originales con sus IDs para referencias futuras
        this.selectedParamOptions = [...options];

        if (this.selectedParam) {
          // Transform API data to our component's format
          this.selectedParam.subParams = options.map((option, index) => ({
            name: option.label,
            originalIndex: index // Guardar el índice original de cada subparámetro
          }));
          
          // Actualizar la lista filtrada
          this.filterSubParams();
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
      // Asignar índices originales a cada parámetro
      this.filteredParams = this.params.map((param, index) => ({
        ...param,
        originalIndex: index
      }));
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredParams = this.params
      .map((param, index) => ({
        ...param,
        originalIndex: index // Guardar el índice original de cada parámetro
      }))
      .filter(param => 
        param.name.toLowerCase().includes(query)
      );
  }

  
}
