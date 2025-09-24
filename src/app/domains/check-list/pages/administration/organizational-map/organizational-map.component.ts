import { Component, ViewChild, OnInit, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkMaintenancePopupComponent } from '../../../components/work-maintenance-popup/work-maintenance-popup.component';
import { AreaMaintenancePopupComponent } from '../../../components/area-maintenance-popup/area-maintenance-popup.component';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SubParametroService } from '../../../services/sub-parametro.service';
import { UsuarioService } from '../../../services/usuario.service';
import { UsuarioItem } from '../../../models/usuario.models';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-organizational-map',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CustomSelectComponent,
    DataTableComponent,
  ],
  templateUrl: './organizational-map.component.html',
  styleUrl: './organizational-map.component.scss',
})
export class OrganizationalMapComponent implements OnInit {
  // Expose ParameterType enum to the template
  parameterTypes = ParameterType;
  editForm: FormGroup;
  selectedIndex: number = -1; // Estado de edición
  currentEditIndex: number | null = null;
  isEditMode = false;
  currentUserId: number | null = null;
  isLoading = false;
  // Show search bar in the data table
  showSearchBar: boolean = true;
  // Flag to control form visibility (collapsed by default)
  isFormVisible: boolean = false;
  
  // Options for the custom-select components
  cargosOptions: SelectOption[] = [];
  accesosOptions: SelectOption[] = [];
  empresasOptions: SelectOption[] = [];
  
  // Flag to track if select options are loaded
  private selectOptionsLoaded = false;

  // Configuration for the data table
  tableColumns = [
    { name: 'usuario', label: 'Usuario' },
    { name: 'nombre', label: 'Nombre' },
    { name: 'cargo', label: 'Cargo' },
    { name: 'tipoAcceso', label: 'Tipo Acceso' },
    { name: 'empresa', label: 'Empresa' },
    { name: 'email', label: 'eMail' },
    { name: 'celular', label: 'Celular' },
    { name: 'obras', label: 'Obras' },
    { name: 'areas', label: 'Áreas' },
  ];

  tableActionButtons = [
    { icon: 'edit', color: 'accent', tooltip: 'Editar', action: 'edit' },
    { icon: 'close', color: 'warn', tooltip: 'Eliminar', action: 'delete' }
  ];
  
  // Initial mock data that will be replaced with API data when loaded
  tableData = [
    {
      usuario: 'cargando...',
      nombre: 'cargando...',
      cargo: 'cargando...',
      tipoAcceso: 'cargando...',
      empresa: 'cargando...',
      email: 'cargando...',
      celular: 'cargando...'
    }
  ];

  constructor(
    private fb: FormBuilder, 
    private dialog: MatDialog,
    private subParametroService: SubParametroService,
    private usuarioService: UsuarioService,
    private snackBar: MatSnackBar
  ) {
    this.editForm = this.fb.group({
      usuario: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      idCargo: ['', [Validators.required]],
      idPerfil: ['15'], // Using default value as this isn't directly editable in the UI
      idTipoAcceso: ['', [Validators.required]],
      idEmpresaContratista: ['', [Validators.required]],
      eMail: [''],
      clave: [''],
      celular: [''],
    });
  }

  ngOnInit() {
    this.loadData();
    
    // Si estamos en modo desarrollo, autollenar el formulario después de cargar los datos
    if (isDevMode()) {
      // Esperar a que se carguen los datos de los selects
      setTimeout(() => {
        // this.fillDebugData();
      }, 1000);
    }
  }
  
  /**
   * SOLO PARA DEBUG: Rellena el formulario con datos de ejemplo
   */
  fillDebugData() {
    if (!isDevMode()) return;
    
    console.log('DEBUG: Rellenando formulario con datos de prueba');
    
    // Mostrar el formulario si está oculto
    this.isFormVisible = true;
    
    // Esperar un poco para que se inicialicen los controles
    setTimeout(() => {
      // Rellenar con los datos del ejemplo usando los IDs específicos
      this.editForm.patchValue({
        usuario: 'JMARQUEZL',
        nombre: 'JORGE MARQUEZ',
        eMail: 'JMARQUEZ82@GMAIL.COM',
        clave: 'Password123', // Contraseña de prueba para desarrollo
        celular: '979773457',
        idCargo: '15',           // ID especificado por el usuario
        idPerfil: '15',          // ID de perfil por defecto
        idTipoAcceso: '1033',    // Asumiendo un valor por defecto para el tipo de acceso
        idEmpresaContratista: '18'  // ID especificado por el usuario
      });
      
      console.log('DEBUG: Formulario rellenado con datos de prueba');
    }, 500);
  }
  
  /**
   * Toggle the visibility of the form
   */
  toggleFormVisibility() {
    this.isFormVisible = !this.isFormVisible;
  }
  
  /**
   * Reset the form to its initial state and mark fields as pristine and untouched
   * to avoid validation styling on empty fields
   */
  /**
   * Reset form to its initial state and clear validation states
   */
  resetForm() {
    // Reset form values
    this.editForm.reset();
    
    // Reset edit state
    this.isEditMode = false;
    this.currentEditIndex = null;
    this.currentUserId = null;
    
    // Mark the entire form as pristine and untouched
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
    
    // Also reset each control individually to ensure proper state reset
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      if (control) {
        control.markAsPristine();
        control.markAsUntouched();
        control.setErrors(null);
      }
    });
    
    // Initialize form validation state after a slight delay
    setTimeout(() => {
      // Re-apply validators if needed
      if (this.editForm.get('usuario')) {
        this.editForm.get('usuario')!.updateValueAndValidity();
      }
    }, 100);
  }
  
  /**
   * Load all data needed for the page
   */
  loadData() {
    // Load both user data and select options
    this.loadSelectOptions();
    this.loadUsers();
  }
  
  /**
   * Load select options data for cargo, tipo acceso, and empresa
   */
  loadSelectOptions() {
    this.subParametroService.getAllParametros()
      .subscribe({
        next: (response) => {
          console.log('Loaded select options:', response);
          this.cargosOptions = response.cargos;
          this.accesosOptions = response.tipoAccesos;
          this.empresasOptions = response.empresas;
          this.selectOptionsLoaded = true;
        },
        error: (error) => {
          console.error('Error loading select options:', error);
        }
      });
  }
  
  /**
   * Map text label to select option ID
   * @param text The text label to find
   * @param options The options array to search in
   * @returns The ID if found, empty string otherwise
   */
  private mapTextToId(text: string, options: SelectOption[]): string {
    if (!text || !options || options.length === 0) {
      return '';
    }
    
    const option = options.find(opt => 
      opt.label && opt.label.toLowerCase().trim() === text.toLowerCase().trim()
    );
    
    return option ? option.value : '';
  }
  
  /**
   * Load user data from API
   */
  loadUsers() {
    this.isLoading = true;
    
    return this.usuarioService.getAllUsers()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('Loaded users:', response);
          
          // New API response format from inarco-ssoma.favric.cl uses success instead of glosa
          if (response.success && response.data && response.data.length > 0) {
            console.log('Successfully loaded users from API');
            
            // Map data using the same structure
            this.tableData = response.data.map((user: any) => ({
              userId: Number(user.IdUsuario), // Store user ID for API calls
              usuario: user.Usuario,
              nombre: user.Nombre,
              cargo: user.Cargo,
              tipoAcceso: user.TipoAcceso,
              empresa: user.EmpresaContratista,
              email: user.EMail,
              celular: user.celular
            }));
          } else if (response.glosa === 'Ok' && response.data && response.data.length > 0) {
            // Legacy API response format as fallback
            console.log('Using legacy API response format');
            
            // Map using the same structure
            this.tableData = response.data.map((user: any) => ({
              userId: Number(user.IdUsuario),
              usuario: user.Usuario,
              nombre: user.Nombre,
              cargo: user.Cargo,
              tipoAcceso: user.TipoAcceso,
              empresa: user.EmpresaContratista,
              email: user.EMail,
              celular: user.celular
            }));
          } else {
            console.warn('API response did not contain valid user data, using fallback data');
          }
        },
        error: (error) => {
          console.error('Error loading users:', error);
          // Keep using the mock data if API fails
        }
      });
  }

  /**
   * Set up the form for editing an existing user
   * @param element User data object
   * @param index Index in tableData array
   */
  updateUser(element: any, index: number): void {
    // Asegurar que el formulario sea visible cuando se inicia edición
    this.isFormVisible = true;
    
    // Set edit mode flags
    this.isEditMode = true;
    this.currentEditIndex = index;
    this.currentUserId = element.userId;
    
    // Wait for select options to be loaded before patching values
    if (this.selectOptionsLoaded) {
      this.patchUserFormValues(element);
    } else {
      // Wait a bit for the options to load and then patch
      const checkInterval = setInterval(() => {
        if (this.selectOptionsLoaded) {
          this.patchUserFormValues(element);
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Timeout after 5 seconds to avoid infinite loop
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!this.selectOptionsLoaded) {
          console.warn('Select options not loaded, patching with available data');
          this.patchUserFormValues(element);
        }
      }, 5000);
    }
    
    console.log('Editing user:', element);
  }
  
  /**
   * Patch form values with user data, mapping text values to IDs
   * @param element User data object
   */
  private patchUserFormValues(element: any): void {
    // Map text values to select IDs
    const cargoId = this.mapTextToId(element.cargo, this.cargosOptions);
    const tipoAccesoId = this.mapTextToId(element.tipoAcceso, this.accesosOptions);
    const empresaId = this.mapTextToId(element.empresa, this.empresasOptions);
    
    console.log('Mapping results:', {
      cargo: { text: element.cargo, id: cargoId },
      tipoAcceso: { text: element.tipoAcceso, id: tipoAccesoId },
      empresa: { text: element.empresa, id: empresaId }
    });
    
    // Llenar el formulario con los datos del elemento seleccionado
    this.editForm.patchValue({
      usuario: element.usuario,
      nombre: element.nombre,
      idCargo: cargoId,
      idTipoAcceso: tipoAccesoId,
      idEmpresaContratista: empresaId,
      eMail: element.email,  // Mantener consistente con la API (eMail)
      celular: element.celular,
      // No incluimos clave ya que no queremos modificarla automáticamente
    });
  }

  /**
   * Elimina un usuario del sistema
   * @param item El usuario a eliminar
   * @param index La posición en el array tableData
   */
  eliminarUsuario(item: any, index: number): void {
    const userId = item?.userId;
    if (userId) {
      // Implementar funcionalidad de eliminación
      this.isLoading = true;
      this.usuarioService.deleteUser(userId)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            if (response && response.success) {
              this.snackBar.open('Usuario eliminado correctamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              
              // Actualizar la tabla eliminando el registro
              // 1. Crear una copia nueva del array para forzar la detección de cambios
              const newTableData = [...this.tableData];
              // 2. Eliminar el elemento
              newTableData.splice(index, 1);
              // 3. Asignar el nuevo array, para garantizar que Angular detecte el cambio
              this.tableData = newTableData;
              
              // Posiblemente necesitamos recargar la vista (usar setTimeout para ejecutarlo después del ciclo actual)
              setTimeout(() => {
                // Esta asignación adicional garantiza que el componente DataTable detecte el cambio
                this.tableData = [...this.tableData];
              }, 0);
            } else {
              this.snackBar.open('Error al eliminar: ' + (response.message || 'Error desconocido'), 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar usuario:', error);
            this.snackBar.open('Error en la comunicación con el servidor', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      this.snackBar.open('No se puede eliminar: ID de usuario no válido', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }
  
  /**
   * Process form submission for creating or updating a user
   */
  onSubmit(): void {
    if (this.editForm.valid) {
      this.isLoading = true;
      
      // Obtener valores del formulario
      const formValue = this.editForm.value;
      
      // Codificar la contraseña en base64
      const passwordBase64 = formValue.clave ? btoa(formValue.clave) : '';
      
      // Construir el objeto para enviar
      const userData: any = {
        caso: this.isEditMode ? 'Modifica' : 'Crea',
        usuario: formValue.usuario,
        nombre: formValue.nombre,
        idCargo: formValue.idCargo,
        idPerfil: formValue.idPerfil || '15', // Default value if not present
        idTipoAcceso: formValue.idTipoAcceso,
        idEmpresaContratista: formValue.idEmpresaContratista,
        eMail: formValue.eMail || '',
        celular: formValue.celular || ''
      };
      
      // Agregar idUsuario solo para edición (Modifica)
      if (this.isEditMode && this.currentUserId) {
        userData.idUsuario = this.currentUserId;
      }
      
      // Agregar contraseña (solo para creación o si se cambió en edición)
      if (passwordBase64) {
        userData.clave = passwordBase64;
      }

      console.log('Creating/updating user with data:', userData);
      
      this.usuarioService.createUpdateUser(userData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            console.log('Create/update user response:', response);
            
            if (response && response.success) {
              this.snackBar.open(
                this.isEditMode ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 
                'Cerrar', 
                {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                }
              );

              // Hide form after successful submission
              this.isFormVisible = false;
              
              // Restore form
              this.resetForm();
              
              // Update user list
              this.loadUsers();
            } else {
              this.snackBar.open(`Error: ${response?.message || 'Error desconocido'}`, 'Cerrar', {
                duration: 5000, 
                panelClass: ['error-snackbar']
              });
            }
          },
          error: (error) => {
            console.error('Error creating/updating user:', error);
            this.snackBar.open('Error en la comunicación con el servidor', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Mark all fields as touched to display validation errors
      this.markFormGroupTouched(this.editForm);
      
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }
  
  /**
   * Open the work maintenance popup for a user
   */
  openPopup(userId: number, userName: string): void {
    const dialogRef = this.dialog.open(WorkMaintenancePopupComponent, {
      width: '800px',
      disableClose: true,
      data: { userId, userName }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      // Handle any post-dialog actions if needed
    });
  }

  /**
   * Open the area maintenance popup for a user
   */
  openAreasPopup(userId: number, userName: string): void {
    const dialogRef = this.dialog.open(AreaMaintenancePopupComponent, {
      width: '800px',
      disableClose: true,
      data: { userId, userName }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Areas dialog closed with result:', result);
      // Handle any post-dialog actions if needed
    });
  }
    
  /**
   * Mark all controls in a form group as touched to trigger validation display
   * @param formGroup The FormGroup to mark as touched
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
        
        // If control is a nested form group, recursively mark its controls
        if (control instanceof FormGroup) {
          this.markFormGroupTouched(control);
        }
      }
    });
  }

  /**
   * Handle actions from the data table
   */
  handleTableAction(event: {action: string, item: any, index: number}): void {
    console.log('Table action:', event);
    
    switch(event.action) {
      case 'edit':
        this.updateUser(event.item, event.index);
        break;
      case 'delete':
        // Mostrar diálogo de confirmación antes de eliminar
        const userName = event.item?.nombre || 'este usuario';
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          width: '400px',
          data: {
            title: 'Confirmar Eliminación',
            message: `¿Está seguro que desea eliminar a ${userName}?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            console.log('Eliminando usuario...', event.item);
            // Mostrar indicador de carga
            this.isLoading = true;
            // Llamar a la función para eliminar usuario si confirma
            this.eliminarUsuario(event.item, event.index);
          }
        });
        break;
      case 'obras':
        if (event.item && event.item.userId) {
          this.openPopup(event.item.userId, event.item.nombre);
        } else {
          console.error('Cannot open obras popup: Missing user ID or name', event.item);
          alert('No se puede abrir el mantenedor de obras: Datos de usuario incompletos');
        }
        break;
      case 'areas':
        if (event.item && event.item.userId) {
          this.openAreasPopup(event.item.userId, event.item.nombre);
        } else {
          console.error('Cannot open areas popup: Missing user ID or name', event.item);
          alert('No se puede abrir el mantenedor de áreas: Datos de usuario incompletos');
        }
        break;
    }
  }
}
