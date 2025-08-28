import { Component, Input, ViewChild, AfterViewInit, OnChanges, SimpleChanges, ViewEncapsulation, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule, MatSelect } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HistoricalReportItem } from '../../../../../../core/services/report.service';

@Component({
  selector: 'app-history-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './history-table.component.html',
  styleUrls: ['./history-table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HistoryTableComponent implements AfterViewInit, OnChanges {  
  // Estado para mostrar/ocultar filtros
  showFilters = true;
  // Input para recibir los datos de la tabla
  @Input() data: HistoricalReportItem[] = [];
  
  // Tabla de datos
  dataSource = new MatTableDataSource<HistoricalReportItem>([]);
  displayedColumns: string[] = ['fecha', 'Obra', 'Usuario', 'Actividad', 'tipo', 'estado'];
  
  // Opciones para los filtros select
  filtroObras: string[] = [];
  filtroUsuarios: string[] = [];
  filtroTipos: string[] = [];
  filtroEstados: string[] = [];
  
  // Valores seleccionados para cada filtro
  selectedObras: string[] = [];
  selectedUsuarios: string[] = [];
  selectedTipos: string[] = [];
  selectedEstados: string[] = [];
  
  // Referencia al paginador y ordenamiento
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Filtros adicionales - ahora usando arrays para multiselect
  filterValues: { [key: string]: string | string[] } = {
    Obra: [],
    Usuario: [],
    tipo: [],
    estado: []
  };

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      const data = changes['data'].currentValue;
      this.dataSource.data = data;
      
      // Generar opciones únicas para los selectores de filtro
      this.filtroObras = this.getUniqueValues(data, 'Obra');
      this.filtroUsuarios = this.getUniqueValues(data, 'Usuario');
      this.filtroTipos = this.getUniqueValues(data, 'tipo');
      this.filtroEstados = this.getUniqueValues(data, 'estado');
    }
  }
  
  /**
   * Extrae valores únicos de un campo específico en un array de datos
   */
  private getUniqueValues(data: HistoricalReportItem[], field: keyof HistoricalReportItem): string[] {
    const values = data
      .map(item => item[field]?.toString() || '')
      .filter(value => value !== '');
      
    // Eliminar duplicados y ordenar
    return [...new Set(values)].sort();
  }

  /**
   * Configura el filtro personalizado para la tabla
   */
  setupFilter(): void {
    this.dataSource.filterPredicate = (data: HistoricalReportItem, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      
      // Manejando búsqueda global primero
      if (searchTerms.globalFilter && searchTerms.globalFilter.length > 0) {
        const globalSearch = searchTerms.globalFilter.toLowerCase();
        // Busca en todos los campos relevantes
        const searchableFields: (keyof HistoricalReportItem)[] = ['fecha', 'Obra', 'Usuario', 'Actividad', 'tipo', 'estado'];
        const matchesGlobalSearch = searchableFields.some(field => {
          const value = data[field]?.toString().toLowerCase() || '';
          return value.includes(globalSearch);
        });
        
        if (!matchesGlobalSearch) return false;
      }
      
      // Filtros de columnas específicas
      return Object.keys(searchTerms).every(key => {
        if (key === 'globalFilter') return true; // Ya procesamos este filtro
        
        const filterValue = searchTerms[key];
        
        // Si el filtro está vacío o es un array vacío, retorna true
        if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;
        
        const dataValue = data[key as keyof HistoricalReportItem]?.toString().toLowerCase() || '';
        
        // Si es un array (multiselect), verificamos si alguno de los valores seleccionados coincide
        if (Array.isArray(filterValue)) {
          return filterValue.some(value => 
            dataValue.includes(value.toLowerCase())
          );
        } else {
          // Para filtros de texto simple
          return dataValue.includes(filterValue.toLowerCase());
        }
      });
    };
  }

  /**
   * Actualiza el filtro de la tabla
   */
  updateFilter(property: keyof HistoricalReportItem, value: string | string[]): void {
    this.filterValues[property] = value;
    this.dataSource.filter = JSON.stringify({
      ...this.filterValues,
      globalFilter: this.globalFilterValue
    });
    
    // Reiniciar el paginador
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Filtro para columna Obra
   */
  applyFilterObra(value: string[]): void {
    this.updateFilter('Obra', value);
  }
  
  /**
   * Filtro para columna Usuario
   */
  applyFilterUsuario(value: string[]): void {
    this.updateFilter('Usuario', value);
  }
  
  /**
   * Filtro para columna Tipo
   */
  applyFilterTipo(value: string[]): void {
    this.updateFilter('tipo', value);
  }
  
  /**
   * Filtro para columna Estado
   */
  applyFilterEstado(value: string[]): void {
    this.updateFilter('estado', value);
  }
  
  // Texto para búsqueda global
  globalFilterValue = '';
  
  /**
   * Aplica filtro global a todos los campos
   */
  applyGlobalFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.globalFilterValue = filterValue.trim().toLowerCase();
    
    // Aplica el filtro global a través del filterPredicate configurado
    this.dataSource.filter = JSON.stringify({
      ...this.filterValues,
      globalFilter: this.globalFilterValue
    });
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  /**
   * Limpia la búsqueda global
   */
  clearGlobalFilter(): void {
    this.globalFilterValue = '';
    this.dataSource.filter = JSON.stringify({
      ...this.filterValues,
      globalFilter: ''
    });
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  /**
   * Alterna la visibilidad de los filtros
   */
  toggleFilterView(): void {
    this.showFilters = !this.showFilters;
  }
  
  /**
   * Verifica si hay algún filtro activo
   * @returns true si hay al menos un filtro activo
   */
  hasActiveFilters(): boolean {
    const hasObras = Array.isArray(this.selectedObras) && this.selectedObras.length > 0;
    const hasUsuarios = Array.isArray(this.selectedUsuarios) && this.selectedUsuarios.length > 0;
    const hasTipos = Array.isArray(this.selectedTipos) && this.selectedTipos.length > 0;
    const hasEstados = Array.isArray(this.selectedEstados) && this.selectedEstados.length > 0;
    const hasGlobalFilter = typeof this.globalFilterValue === 'string' && this.globalFilterValue.trim().length > 0;
    
    return hasObras || hasUsuarios || hasTipos || hasEstados || hasGlobalFilter;
  }

  /**
   * Limpia todos los filtros de la tabla
   */
  clearFilters(): void {
    this.filterValues = {
      Obra: [],
      Usuario: [],
      tipo: [],
      estado: []
    };
    
    // Resetear las selecciones
    this.selectedObras = [];
    this.selectedUsuarios = [];
    this.selectedTipos = [];
    this.selectedEstados = [];
    this.globalFilterValue = '';
    
    this.dataSource.filter = JSON.stringify({
      ...this.filterValues,
      globalFilter: ''
    });
    
    // Reiniciar el paginador
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  /**
   * Limpia un filtro específico
   */
  clearFilterSingle(filterName: string): void {
    switch(filterName) {
      case 'Obra':
        this.filterValues['Obra'] = [];
        this.selectedObras = [];
        this.applyFilterObra([]);
        break;
      case 'Usuario':
        this.filterValues['Usuario'] = [];
        this.selectedUsuarios = [];
        this.applyFilterUsuario([]);
        break;
      case 'tipo':
        this.filterValues['tipo'] = [];
        this.selectedTipos = [];
        this.applyFilterTipo([]);
        break;
      case 'estado':
        this.filterValues['estado'] = [];
        this.selectedEstados = [];
        this.applyFilterEstado([]);
        break;
    }
  }
  
  /**
   * Selecciona todas las opciones de un filtro específico
   */
  selectAllOptions(filterName: string): void {
    switch(filterName) {
      case 'Obra':
        this.selectedObras = [...this.filtroObras];
        this.applyFilterObra(this.selectedObras);
        break;
      case 'Usuario':
        this.selectedUsuarios = [...this.filtroUsuarios];
        this.applyFilterUsuario(this.selectedUsuarios);
        break;
      case 'tipo':
        this.selectedTipos = [...this.filtroTipos];
        this.applyFilterTipo(this.selectedTipos);
        break;
      case 'estado':
        this.selectedEstados = [...this.filtroEstados];
        this.applyFilterEstado(this.selectedEstados);
        break;
    }
  }
  
  /**
   * Ajusta las dimensiones y posición del panel de opciones cuando se abre
   * @param select El componente mat-select
   * @param isOpen Si el panel está abierto
   */
  adjustPanelHeight(select: MatSelect, isOpen: boolean): void {
    if (isOpen) {
      // Pequeño timeout para esperar que el panel se renderice inicialmente
      setTimeout(() => {
        // Selecciona el panel de opciones actual
        const panel = document.querySelector('.cdk-overlay-pane:not(.cdk-visually-hidden) .mat-mdc-select-panel') as HTMLElement;
        if (panel) {
          // Configurar transiciones antes de modificar propiedades (paso 1)
          panel.style.transition = 'min-width 0.25s ease-out, width 0.25s ease-out';
          
          // Ya no necesitamos aplicar estilos para evitar selecciones de texto aquí
          // porque lo hemos movido a styles.scss global
          
          // Aplicar estilos específicos para las opciones (texto y formato)
          const options = panel.querySelectorAll('.mat-mdc-option .mdc-list-item__primary-text') as NodeListOf<HTMLElement>;
          options.forEach(option => {
            option.style.whiteSpace = 'nowrap';
            option.style.overflow = 'hidden';
            option.style.textOverflow = 'ellipsis';
            option.style.display = 'block';
          });
          
          // Añadir prevención de eventos de selección por precaución
          panel.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
          });
          
          // También asegurar que los checkbox no permitan selección de texto
          const checkboxes = panel.querySelectorAll('.mat-pseudo-checkbox') as NodeListOf<HTMLElement>;
          checkboxes.forEach(checkbox => {
            checkbox.style.userSelect = 'none';
          });
          
          // Selecciona el contenedor del overlay
          const overlayPane = document.querySelector('.cdk-overlay-pane:not(.cdk-visually-hidden)') as HTMLElement;
          if (overlayPane) {
            // Configurar transiciones antes de modificar propiedades (paso 1)
            overlayPane.style.transition = 'transform 0.25s ease-out, min-width 0.25s ease-out';
            
            // Pequeño retraso para que las transiciones se apliquen después (paso 2)
            setTimeout(() => {
              // Modifica las dimensiones
              panel.style.minWidth = '250px';
              overlayPane.style.minWidth = '250px';
              
              // Ajustar la posición hacia la izquierda
              // Primero obtenemos la transformación actual
              const currentTransform = window.getComputedStyle(overlayPane).transform;
              
              // Si ya tiene una transformación, la modificamos
              if (currentTransform && currentTransform !== 'none') {
                // Extraemos la matriz de transformación
                const matrix = new DOMMatrix(currentTransform);
                // Movemos 50px a la izquierda
                matrix.e -= 50; // Desplazamiento en X
                overlayPane.style.transform = matrix.toString();
              } else {
                // Si no tiene transformación, agregamos una para mover 50px a la izquierda
                overlayPane.style.transform = 'translateX(-50px)';
              }
              
              // Aseguramos que no se salga de la pantalla
              const rect = overlayPane.getBoundingClientRect();
              if (rect.left < 0) {
                overlayPane.style.transform = 'translateX(0)';
              }
            }, 50); // Un pequeño retraso para aplicar los cambios después de establecer la transición
          }
        }
      }, 0);
    }
  }
}
