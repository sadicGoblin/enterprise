import { Component, ViewChild, OnInit, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
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
  selectedIndex: number | null = null;
  currentEditIndex: number | null = null;
  isLoading: boolean = false;
  // Show search bar in the data table
  showSearchBar: boolean = true;
  // Flag to control form visibility (collapsed by default)
  isFormVisible: boolean = false;
  
  // Options for the custom-select components
  cargosOptions: SelectOption[] = [];
  accesosOptions: SelectOption[] = [];
  empresasOptions: SelectOption[] = [];

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
      usuario: [''],
      nombre: [''],
      cargo: [''],
      tipoAcceso: [''],
      empresa: [''],
      email: [''],
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
        this.fillDebugData();
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
        email: 'JMARQUEZ82@GMAIL.COM',
        clave: 'Password123', // Contraseña de prueba para desarrollo
        celular: '979773457',
        cargo: '15',           // ID especificado por el usuario
        tipoAcceso: '1033',       // Asumiendo un valor por defecto para el tipo de acceso
        empresa: '18'          // ID especificado por el usuario
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
  resetForm() {
    this.editForm.reset();
    this.selectedIndex = null;
    this.currentEditIndex = null;
    
    // Mark the form and all controls as pristine and untouched
    // to avoid validation error messages on empty fields
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      control?.markAsPristine();
      control?.markAsUntouched();
    });
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
  }
  
  /**
   * Load all data needed for the page
   */
  loadData() {
    // Just load user data - the custom select components will load their own options
    this.loadUsers();
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

  editar(element: any, index: number): void {
    this.editForm.patchValue(element);
    this.currentEditIndex = index;
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      this.isLoading = true;
      
      // Obtener los valores del formulario
      const formValues = this.editForm.value;
      
      // Codificar la contraseña en base64 si existe
      const claveBase64 = formValues.clave ? btoa(formValues.clave) : '';
      
      // Crear el body para el servicio según la estructura solicitada
      const requestBody = {
        caso: 'Crea',
        usuario: formValues.usuario,
        nombre: formValues.nombre,
        idCargo: formValues.cargo,
        idPerfil: formValues.cargo, // Asumiendo que idPerfil es igual a idCargo
        idTipoAcceso: formValues.tipoAcceso,
        idEmpresaContratista: formValues.empresa,
        eMail: formValues.email,
        celular: formValues.celular,
        clave: claveBase64 // Contraseña codificada en base64
      };
      
      console.log('Enviando solicitud para crear/actualizar usuario:', requestBody);
      
      // Llamar al servicio
      this.usuarioService.createUpdateUser(requestBody)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            if (response && response.success) {
              console.log('Usuario creado/actualizado correctamente:', response);
              // Mostrar mensaje de éxito
              this.snackBar.open('Usuario guardado exitosamente', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              // Recargar la lista de usuarios
              this.loadUsers();
              // Resetear el formulario
              this.resetForm();
              // Ocultar el formulario
              this.isFormVisible = false;
            } else {
              console.error('Error al crear/actualizar usuario:', response);
              this.snackBar.open('Error al guardar: ' + (response.message || 'Error desconocido'), 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          },
          error: (error) => {
            console.error('Error en la llamada al servicio:', error);
            this.snackBar.open('Error en la comunicación con el servidor', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
    } else {
      // Marcar todos los campos como touched para mostrar los errores
      Object.keys(this.editForm.controls).forEach(key => {
        const control = this.editForm.get(key);
        control?.markAsTouched();
      });
      alert('Por favor complete todos los campos requeridos correctamente.');
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
   * Handle actions from the data table
   */
  handleTableAction(event: {action: string, item: any, index: number}): void {
    console.log('Table action:', event);
    
    switch(event.action) {
      case 'edit':
        this.editar(event.item, event.index);
        break;
      case 'delete':
        // Implement delete functionality
        if (confirm('¿Está seguro que desea eliminar este elemento?')) {
          this.tableData.splice(event.index, 1);
          this.tableData = [...this.tableData]; // Create new array reference to trigger change detection
        }
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
