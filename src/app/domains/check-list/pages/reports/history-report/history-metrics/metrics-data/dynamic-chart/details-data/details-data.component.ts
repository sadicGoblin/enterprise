import { Component, Inject, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ExportService, ExportColumn } from '../../../../../../../../../shared/services/export.service';

@Component({
  selector: 'app-details-data',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    DragDropModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './details-data.component.html',
  styleUrl: './details-data.component.scss'
})
export class DetailsDataComponent implements OnInit, AfterViewInit {
  data: any[] = [];
  title: string = 'Datos Filtrados';
  
  // Properties for table display
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  
  // Paginator and sorting properties
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  pageSize = 10; // 10 elementos por página como solicitado
  
  // Search property
  filterValue: string = '';
  
  constructor(
    public dialogRef: MatDialogRef<DetailsDataComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: {
      data: any[], 
      title: string, 
      draggable?: boolean,
      columns?: string[] // Columnas específicas a mostrar desde reportConfig
    },
    private exportService: ExportService
  ) {
    // Inicializar con los datos recibidos del dialog
    if (dialogData) {
      this.data = dialogData.data || [];
      this.title = dialogData.title || 'Datos Filtrados';
      // Si se proporcionan columnas específicas, las utilizamos
      if (dialogData.columns && dialogData.columns.length > 0) {
        this.displayedColumns = dialogData.columns;
      }
    }
  }
  
  ngOnInit(): void {
    this.setupTableData();
    
    // Configurar el predicado de filtrado personalizado para buscar en todas las columnas
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      // Convertir todos los valores del objeto a texto y buscar en ellos
      return Object.keys(data).some(key => {
        const value = data[key];
        if (value === null || value === undefined) return false;
        
        // Convertir el valor a string y buscar en él
        return String(value).toLowerCase().includes(filter);
      });
    };
  }
  
  /**
   * Configure draggable dialog, paginator, and sorting after view initialization
   */
  ngAfterViewInit(): void {
    // Configure draggable functionality if specified
    if (this.dialogData.draggable) {
      this.setupDraggableDialog();
    }
    
    // Configure paginator and sort after view is initialized
    setTimeout(() => {
      // Configure the MatTableDataSource with both paginator and sort
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    });
  }
  
  /**
   * Configura la funcionalidad de arrastrar el diálogo
   */
  private setupDraggableDialog(): void {
    // Agregar estilos globales mediante CSS para hacer el diálogo arrastrable
    const style = document.createElement('style');
    style.innerHTML = `
      .draggable-dialog .mat-mdc-dialog-container {
        transition: none !important;
      }
      
      .draggable-dialog .details-header {
        cursor: move;
        user-select: none;
      }
      
      .cdk-overlay-pane.draggable-dialog {
        position: relative !important;
      }
    `;
    document.head.appendChild(style);
    
    // Usar biblioteca externa de CDK Drag Drop en futura implementación
    console.log('Configuración para diálogo arrastrable aplicada');
  }
  
  /**
   * Configura los datos y columnas de la tabla basados en los datos de entrada
   * Si se recibieron columnas específicas en la configuración, las usa;  
   * sino, utiliza un algoritmo de detección automática
   */
  private setupTableData(): void {
    if (!this.data || this.data.length === 0) {
      this.displayedColumns = [];
      this.dataSource = new MatTableDataSource<any>([]);
      return;
    }
    
    // Si ya tenemos columnas definidas (pasadas desde la configuración), las usamos directamente
    if (this.displayedColumns && this.displayedColumns.length > 0) {
      // Verificar que las columnas existan en los datos
      const firstItem = this.data[0];
      const todasLasColumnas = Object.keys(firstItem);
      
      // Filtrar solo las columnas que existen en los datos
      this.displayedColumns = this.displayedColumns.filter(col => todasLasColumnas.includes(col));
      
      // Si después de filtrar no quedan columnas, usar detección automática
      if (this.displayedColumns.length === 0) {
        this.setupColumnasPorDefecto(firstItem);
      }
    } else {
      // No hay columnas predefinidas, usar detección automática
      const firstItem = this.data[0];
      this.setupColumnasPorDefecto(firstItem);
    }
    
    // Configurar MatTableDataSource con los datos
    this.dataSource = new MatTableDataSource<any>(this.data);
    
    // Configurar accesores de datos para ordenamiento personalizado
    this.setupSortingDataAccessors();
    
    // Configurar filtro para que busque en todas las propiedades
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return Object.keys(data).some(key => {
        const value = data[key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(filter);
      });
    };
  }
  
  /**
   * Configura las columnas de la tabla usando un algoritmo por defecto
   * cuando no hay configuración específica de columnas
   */
  private setupColumnasPorDefecto(firstItem: any): void {
    // Get all properties from item
    const todasLasColumnas = Object.keys(firstItem);
    
    // Columnas prioritarias que se mostrarán primero si existen
    const columnasPrioritarias = ['fecha', 'id', 'Obra', 'Usuario', 'tipo', 'estado'];
    
    // Move priority columns to the front if they exist
    const columnasOrdenadas = [
      ...columnasPrioritarias.filter(col => todasLasColumnas.includes(col)),
      ...todasLasColumnas.filter(col => !columnasPrioritarias.includes(col))
    ];
    
    // Limit columns for better display (max 10 columns)
    this.displayedColumns = columnasOrdenadas.slice(0, 10);
  }
  
  /**
   * Define la configuración del clasificador de datos
   */
  setupSortingDataAccessors(): void {
    if (this.dataSource) {
      // Personalizar cómo se ordenan ciertos tipos de datos
      this.dataSource.sortingDataAccessor = (item: any, columnId: string) => {
        const value = item[columnId];
        
        // Manejar diferentes tipos de datos para un ordenamiento óptimo
        if (value === null || value === undefined) {
          return '';
        }
        
        // Para fechas en formato string, convertirlas para ordenamiento correcto
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.getTime();
            }
          } catch (e) { /* continuar como string si falla */ }
        }
        
        return value;
      };
    }
  }
  
  /**
   * Formato para los valores de celda según su tipo
   */
  formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString('es-ES');
    }
    
    // Detectar fechas en formato string
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        return moment(value).format('DD/MM/YYYY');
      } catch (e) {
        // Si falla parseo, devolver el string original
        return value;
      }
    }
    
    // Para números, formatear con separadores de miles si son grandes
    if (typeof value === 'number' && value > 999) {
      return value.toLocaleString('es-ES');
    }
    
    // Default: convertir a string
    return String(value);
  }
  
  /**
   * Closes the dialog
   */
  /**
   * Applies the search filter to the data table
   * @param event Input event or filter value
   */
  applyFilter(event: Event | string): void {
    const filterValue = typeof event === 'string' 
      ? event 
      : (event.target as HTMLInputElement).value;
    
    this.filterValue = filterValue.trim().toLowerCase();
    this.dataSource.filter = this.filterValue;
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  /**
   * Exports the current data to Excel format
   * Exports ALL columns from the original data, not just displayed columns
   */
  exportToExcel(): void {
    if (!this.data || this.data.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }

    // Get ALL columns from the first data item
    const firstItem = this.data[0];
    const allColumnNames = Object.keys(firstItem);

    // Create columns for ALL properties in the data
    const columns: ExportColumn[] = allColumnNames.map(column => ({
      field: column,
      header: column.charAt(0).toUpperCase() + column.slice(1), // Capitalize first letter
      width: 20
    }));

    // Configure export options
    const fileName = this.title.replace(/\s+/g, '_') || 'Datos_Exportados';
    
    // Export using the service with ALL data columns
    this.exportService.exportToExcel(this.data, columns, {
      fileName: fileName,
      sheetName: 'Datos',
      styleHeader: true,
      autoSizeColumns: true,
      maxColumnWidth: 50
    });
  }

  /**
   * Closes the dialog
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
}
