import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatProgressSpinnerModule,
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
    private usuarioService: UsuarioService
  ) {
    this.editForm = this.fb.group({
      usuario: [''],
      nombre: [''],
      cargo: [''],
      tipoAcceso: [''],
      empresa: [''],
      email: [''],
      celular: [''],
    });
  }

  ngOnInit() {
    this.loadData();
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
      if (this.currentEditIndex !== null) {
        this.tableData[this.currentEditIndex] = this.editForm.value;
      }
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
