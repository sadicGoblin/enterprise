import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkMaintenancePopupComponent } from '../../components/work-maintenance-popup/work-maintenance-popup.component';
import { CustomSelectComponent, SelectOption } from '../../../../shared/controls/custom-select/custom-select.component';
import { SubParametroService } from '../../services/sub-parametro.service';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioItem } from '../../models/usuario.models';
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
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    CustomSelectComponent,
  ],
  templateUrl: './organizational-map.component.html',
  styleUrls: ['./organizational-map.component.scss'],
})
export class OrganizationalMapComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  editForm: FormGroup;
  selectedIndex: number | null = null;
  currentEditIndex: number | null = null;
  isLoading: boolean = false;
  
  // Options for the custom-select components
  cargosOptions: SelectOption[] = [];
  accesosOptions: SelectOption[] = [];
  empresasOptions: SelectOption[] = [];
  
  // Fallback static data (in case API fails)
  private fallbackCargos = [
    'Jefe de Obras',
    'Supervisora',
    'Encargado de Seguridad',
    'Coordinadora',
    'Maestro',
    'Analista',
    'Ingeniero Civil',
    'Arquitecta',
    'Prevencionista',
    'Analista de Proyectos',
    'Obrero',
    'Jefa de Proyectos',
    'Supervisor de Campo',
    'Especialista Técnica',
    'Ingeniero de Terreno',
  ];
  private fallbackAccesos = ['Administrador', 'Limitado', 'Solo lectura'];
  private fallbackEmpresas = [
    'Vinarco',
    'Constructora Sur',
    'SegurObras',
    'Grupo Norte',
    'Edifica Chile',
    'Diseña SpA',
    'Prevencionar',
    'Planifica Ltda.',
    'Infraestructura Ltda.',
    'Consulting Pro',
    'Terreno S.A.',
  ];
  displayedColumns: string[] = [
    'usuario',
    'nombre',
    'cargo',
    'tipoAcceso',
    'empresa',
    'email',
    'celular',
    'obras',
    'areas',
    'acciones',
  ];

  // Initial mock data that will be replaced with API data when loaded
  data = [
    {
      usuario: 'cargando...',
      nombre: 'cargando...',
      cargo: 'cargando...',
      tipoAcceso: 'cargando...',
      empresa: 'cargando...',
      email: 'cargando...',
      celular: 'cargando...',
    }
  ];

  dataSource = new MatTableDataSource<any>(this.data);

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
    this.isLoading = true;
    
    // Load both parameters and user data in parallel
    forkJoin([
      this.loadParametros(),
      this.loadUsers()
    ])
    .pipe(
      finalize(() => this.isLoading = false)
    )
    .subscribe();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  
  /**
   * Load all parameters from the API
   */
  loadParametros() {
    return this.subParametroService.getAllParametros()
      .pipe(
        finalize(() => {})
      )
      .subscribe({
        next: (response) => {
          console.log('Loaded parameters:', response);
          
          // Update options with API data
          if (response.cargos && response.cargos.length > 0) {
            this.cargosOptions = response.cargos;
          } else {
            console.log('Using fallback cargo data');
            this.cargosOptions = this.fallbackCargos.map(cargo => ({ value: cargo, label: cargo }));
          }
          
          if (response.tipoAccesos && response.tipoAccesos.length > 0) {
            this.accesosOptions = response.tipoAccesos;
          } else {
            console.log('Using fallback tipoAcceso data');
            this.accesosOptions = this.fallbackAccesos.map(acceso => ({ value: acceso, label: acceso }));
          }
          
          if (response.empresas && response.empresas.length > 0) {
            this.empresasOptions = response.empresas;
          } else {
            console.log('Using fallback empresa data');
            this.empresasOptions = this.fallbackEmpresas.map(empresa => ({ value: empresa, label: empresa }));
          }
        },
        error: (error) => {
          console.error('Error loading parameters:', error);
          // Fallback to default options if API fails
          this.cargosOptions = this.fallbackCargos.map(cargo => ({ value: cargo, label: cargo }));
          this.accesosOptions = this.fallbackAccesos.map(acceso => ({ value: acceso, label: acceso }));
          this.empresasOptions = this.fallbackEmpresas.map(empresa => ({ value: empresa, label: empresa }));
        }
      });
  }
  
  /**
   * Load user data from API
   */
  loadUsers() {
    return this.usuarioService.getAllUsers()
      .pipe(
        finalize(() => {})
      )
      .subscribe({
        next: (response) => {
          console.log('Loaded users:', response);
          
          if (response.glosa === 'Ok' && response.data && response.data.length > 0) {
            // Replace mock data with API data
            this.data = response.data.map(user => ({
              usuario: user.Usuario,
              nombre: user.Nombre,
              cargo: user.Cargo,
              tipoAcceso: user.TipoAcceso,
              empresa: user.EmpresaContratista,
              email: user.EMail,
              celular: user.celular
            }));
            
            // Update data source
            this.dataSource.data = this.data;
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
        this.data[this.currentEditIndex] = this.editForm.value;
        this.dataSource.data = this.data;
      }
    }
  }
  
  openPopup(): void {
    console.log('opening popup');
    const dialogRef = this.dialog.open(WorkMaintenancePopupComponent, {
      width: '800px',
      disableClose: true,
      data: {
        /* data from */
      },
    });
  }
}
