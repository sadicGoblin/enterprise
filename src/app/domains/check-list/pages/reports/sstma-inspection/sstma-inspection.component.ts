import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';

import { HttpClient } from '@angular/common/http';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../shared/controls/custom-select/custom-select.component';
import { ObraService } from '../../../services/obra.service';
import { ActividadService } from '../../../services/actividad.service';
import { UserContextService } from '../../../../../core/services/user-context.service';
import { InspeccionSSTMA } from '../../../models/actividad.models';
import { InspectionModalComponent } from '../../../components/inspection-modal/inspection-modal.component';

import * as XLSX from 'xlsx';

// Interface para las obras
export interface ObraSimple {
  IdObra: string;
  Obra: string;
}

@Component({
  selector: 'app-sstma-inspection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    CustomSelectComponent
  ],
  templateUrl: './sstma-inspection.component.html',
  styleUrls: ['./sstma-inspection.component.scss']
})
export class SstmaInspectionComponent implements OnInit, AfterViewInit {
  // Control for the form visibility
  isLoading = false;

  // Form controls
  projectControl = new FormControl('');
  indicator = new FormControl('');
  fromDate: Date | null = null;
  toDate: Date | null = null;

  // API Parameters for obra selection - Using the same pattern as add-activities-pp
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiRequestBody: any;
  projectOptionValueKey = 'IdObra';
  projectOptionLabelKey = 'Obra';
  projectParameterType = ParameterType.OBRA;

  // For the custom select components
  obraOptions: SelectOption[] = [];
  indicatorOptions: SelectOption[] = [];
  
  // Original data from API
  obras: ObraSimple[] = [];
  indicators = [
    'Tipo de Riesgo',
    'Usuario',
    'Potencial de Gravedad',
    'Empresa INARCO/SC'
  ];
  
  // Resultados de inspecciones
  inspecciones: InspeccionSSTMA[] = [];
  inspeccionesFiltradas: InspeccionSSTMA[] = [];
  dataSource = new MatTableDataSource<InspeccionSSTMA>([]);
  displayedColumns: string[] = [
    'idInspeccionSSTMA', 
    'fecha', 
    'Obra', 
    'areaTrabajo', 
    'riesgoAsociado', 
    'potencialGravedad', 
    'ambitoInvolucrado', 
    'empresa',
    'usuarioCreacion',
    'actions' // Columna nueva para acciones/botones
  ];
  isResultsLoading = false;
  hasResults = false;
  errorMessage = '';
  filterValue = '';
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private http: HttpClient,
    private obraService: ObraService,
    private actividadService: ActividadService,
    private userContextService: UserContextService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog // Añadir MatDialog para abrir el modal
  ) {}
  
  ngOnInit(): void {
    // Set default dates
    this.fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First day of current month
    this.toDate = new Date(); // Today
    
    // Set up API request details for project selection
    this.setupApiRequest();
    
    // Set up indicator options
    this.setupIndicatorOptions();
    
    console.log('[SSTMA] Component initialized with default dates:', {
      fromDate: this.fromDate,
      toDate: this.toDate
    });
  }
  
  ngAfterViewInit(): void {
    // Configurar el ordenamiento y la paginación después de inicializar la vista
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      
      // Configuración personalizada para ordenamiento de fechas
      this.dataSource.sortingDataAccessor = (item: InspeccionSSTMA, property: string) => {
        switch(property) {
          case 'fecha':
            return new Date(item.fecha).getTime();
          case 'idInspeccionSSTMA':
            return item.idInspeccionSSTMA;
          case 'Obra':
            return item.Obra;
          case 'areaTrabajo':
            return item.areaTrabajo;
          case 'riesgoAsociado':
            return item.riesgoAsociado;
          case 'potencialGravedad':
            return item.potencialGravedad;
          case 'ambitoInvolucrado':
            return item.ambitoInvolucrado;
          case 'empresa':
            return item.empresa;
          case 'usuarioCreacion':
            return item.usuarioCreacion || '';
          default:
            return '';
        }
      };
    }
  }
  
  /**
   * Initialize the indicator select options
   */
  setupIndicatorOptions(): void {
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
   * Setup API request with user ID
   */
  setupApiRequest(): void {
    // Get user ID from user context or use default
    const userId = this.userContextService.getUserId() || 0;
    
    // Setup API request body for obra service (matching the format used in add-activities-pp)
    this.projectApiRequestBody = {
      caso: 'Consulta',
      idObra: 0,
      idUsuario: userId
    };
    
    console.log('[SSTMA] API request configured with userId:', userId);
  }
  
  /**
   * Handle project selection change
   */
  onProjectSelectionChange(selectedProject: SelectOption | null): void {
    if (selectedProject && selectedProject.value) {
      console.log('[SSTMA] Project selected:', selectedProject.value);
    } else {
      console.log('[SSTMA] Project selection cleared');
    }
  }
  
  /**
   * Reset form controls
   */
  resetForm(): void {
    this.projectControl.reset();
    this.indicator.reset();
    this.fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    this.toDate = new Date();
    this.filterValue = '';
  }

  /**
   * Filtrar inspecciones basado en el término de búsqueda
   * @param event Evento de teclado del input de filtro
   */
  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = this.filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    // Mantener la lista filtrada para otras operaciones como exportación
    this.inspeccionesFiltradas = this.filterValue ? 
      this.dataSource.filteredData : 
      this.inspecciones;
  }

  /**
   * Exportar los datos de inspecciones a Excel
   */
  exportToExcel(): void {
    if (!this.inspeccionesFiltradas.length) {
      this.showMessage('No hay datos para exportar');
      return;
    }
    
    try {
      const fileName = `Inspecciones_SSTMA_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Preparar los datos para la exportación
      const exportData = this.inspeccionesFiltradas.map(item => ({
        'ID': item.idInspeccionSSTMA,
        'Fecha': item.fecha,
        'Obra': item.Obra,
        'Área de Trabajo': item.areaTrabajo,
        'Riesgo Asociado': item.riesgoAsociado,
        'Potencial Gravedad': item.potencialGravedad,
        'Ámbito': item.ambitoInvolucrado,
        'Empresa': item.empresa,
        'Acción': item.accion,
        'Medida de Control': item.medidaControl,
        'Profesional Responsable': item.profesionalResponsable
      }));
      
      // Crear el libro y hoja de Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inspecciones');
      
      // Guardar archivo
      XLSX.writeFile(workbook, fileName);
      
      this.showMessage('Datos exportados correctamente');
    } catch (error) {
      console.error('[SSTMA] Error exporting data:', error);
      this.showMessage('Error al exportar los datos');
    }
  }

  /**
   * Search inspection reports with current filters
   */
  buscarReportes(): void {
    const idObra = this.projectControl.value;
    
    if (!idObra) {
      this.showMessage('Debe seleccionar una obra');
      return;
    }
    
    console.log('[SSTMA] Searching with filters:', {
      proyecto: idObra,
      indicador: this.indicator.value,
      fechaDesde: this.fromDate,
      fechaHasta: this.toDate
    });
    
    this.isLoading = true;
    this.isResultsLoading = true;
    this.hasResults = false;
    this.errorMessage = '';
    
    this.actividadService.getInspeccionesSSTMA(Number(idObra)).subscribe({
      next: (response) => {
        console.log('[SSTMA] Response:', response);
        this.hasResults = true;
        
        if (response && response.success && response.data && response.data.length > 0) {
          // Ordenar las inspecciones por fecha descendente antes de asignarlas
          this.inspecciones = response.data.sort((a: InspeccionSSTMA, b: InspeccionSSTMA) => {
            const fechaA = new Date(a.fecha).getTime();
            const fechaB = new Date(b.fecha).getTime();
            return fechaB - fechaA; // Orden descendente (más reciente primero)
          });
          
          this.inspeccionesFiltradas = [...this.inspecciones];
          this.dataSource = new MatTableDataSource<InspeccionSSTMA>(this.inspeccionesFiltradas);
          
          // Configurar el ordenador y paginador
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
          
          console.log('[SSTMA] Inspecciones cargadas y ordenadas por fecha descendente:', this.inspecciones.length);
        } else {
          this.inspecciones = [];
          this.inspeccionesFiltradas = [];
          this.dataSource = new MatTableDataSource<InspeccionSSTMA>([]);
          this.errorMessage = 'No se encontraron inspecciones para la obra seleccionada';
          console.warn('[SSTMA] No inspections found in response');
        }
        this.isLoading = false;
        this.isResultsLoading = false;
      },
      error: (error) => {
        console.error('[SSTMA] Error loading inspections:', error);
        this.inspecciones = [];
        this.errorMessage = 'Error al cargar las inspecciones';
        this.isLoading = false;
        this.isResultsLoading = false;
        this.showMessage('Error al cargar las inspecciones');
      }
    });
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
  
  /**
   * Abre el modal de inspección para ver detalles de la inspección SSTMA seleccionada
   * @param inspeccion Objeto de inspección SSTMA seleccionado
   */
  openInspectionModal(inspeccion: InspeccionSSTMA): void {
    console.log('[SSTMA] Abriendo modal de inspección para:', inspeccion);
    
    const dialogRef = this.dialog.open(InspectionModalComponent, {
      width: '90vw',
      maxWidth: '1400px',
      disableClose: true,
      autoFocus: false,
      data: { 
        // Convertir los datos de inspección SSTMA al formato esperado por el modal
        projectId: inspeccion.idObra,
        idInspeccionSSTMA: inspeccion.idInspeccionSSTMA,
        // El modal espera estos campos para cargar los datos
        inspectionData: {
          idInspeccion: inspeccion.idInspeccionSSTMA,
          fecha: inspeccion.fecha,
          obra: inspeccion.Obra,
          areaTrabajo: inspeccion.areaTrabajo,
          accion: inspeccion.accion,
          riesgoAsociado: inspeccion.riesgoAsociado,
          potencialGravedad: inspeccion.potencialGravedad,
          ambitoInvolucrado: inspeccion.ambitoInvolucrado,
          medidaControl: inspeccion.medidaControl,
          profesionalResponsable: inspeccion.profesionalResponsable,
          usuarioCreacion: inspeccion.usuarioCreacion
        },
        // Modo de visualización (solo lectura)
        viewMode: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('[SSTMA] Modal de inspección cerrado');
    });
  }
}
