/**
 * Interfaz para definir la configuración de columnas en DataTable
 */
export interface DataTableColumn {
  /** Campo en el objeto de datos que corresponde a esta columna */
  field: string;
  
  /** Título a mostrar en el encabezado de la columna */
  header: string;
  
  /** Ancho de la columna (puede ser en px, % o cualquier unidad CSS válida) */
  width?: string;
  
  /** Indica si la columna es clasificable */
  sortable?: boolean;
  
  /** Alineación del texto en la columna (left, center, right) */
  align?: 'left' | 'center' | 'right';
  
  /** Función de formato personalizada para la celda */
  format?: (value: any, row: any) => string | number | boolean | null;
  
  /** Tipo de dato para aplicar estilos especiales (boolean, number, date, etc.) */
  dataType?: 'text' | 'number' | 'date' | 'boolean' | 'custom';
  
  /** Clase CSS personalizada para aplicar a las celdas de esta columna */
  cellClass?: string;
  
  /** Indica si esta columna debe ser filtrable */
  filterable?: boolean;
}

/**
 * Interfaz para la configuración de la tabla
 */
export interface DataTableConfig {
  /** Indica si se debe mostrar el número de fila */
  showRowNumber?: boolean;
  
  /** Indica si las filas son seleccionables */
  selectable?: boolean;
  
  /** Texto a mostrar cuando no hay datos */
  noDataMessage?: string;
  
  /** Altura máxima de la tabla en cualquier unidad CSS */
  maxHeight?: string;
  
  /** Número de filas a mostrar por página */
  pageSize?: number;
  
  /** Indica si se debe habilitar la paginación */
  pagination?: boolean;

  /** Indica si se debe mostrar una sombra alrededor de la tabla */
  shadow?: boolean;

  /** Texto para el botón de selección de columnas */
  columnSelectLabel?: string;
  
  /** Indica si se deben mostrar los filtros */
  showFilters?: boolean;
  
  /** Etiqueta para el botón de limpiar filtros */
  clearFiltersLabel?: string;
  
  /** Etiqueta para el botón de seleccionar todos */
  selectAllLabel?: string;
  
  /** Texto para la búsqueda global */
  globalSearchLabel?: string;
  
  /** Placeholder para la búsqueda global */
  globalSearchPlaceholder?: string;
  
  /** Indica si se debe mostrar la toolbar con opciones */
  showToolbar?: boolean;
  
  /** Etiqueta para el botón de limpiar todos los filtros en la toolbar */
  clearAllFiltersLabel?: string;
  
  /** Etiqueta para el botón de exportar a Excel */
  exportExcelLabel?: string;
  
  /** Nombre del archivo al exportar a Excel */
  exportFileName?: string;
}

/**
 * Interfaz para eventos de selección de fila
 */
export interface RowSelectionEvent {
  /** Los datos completos de la fila seleccionada */
  row: any;
  
  /** El índice de la fila seleccionada */
  index: number;
  
  /** Estado de selección actual */
  selected: boolean;
}

/**
 * Interfaz para eventos de ordenación
 */
export interface SortEvent {
  /** Campo por el cual ordenar */
  field: string;
  
  /** Dirección de la ordenación */
  order: 'asc' | 'desc';
}

/**
 * Interfaz para eventos de paginación
 */
export interface PageEvent {
  /** Página actual */
  pageIndex: number;
  
  /** Número de filas por página */
  pageSize: number;
  
  /** Total de elementos */
  length: number;
}

/**
 * Interface for filter configuration
 */
export interface DataTableFilter {
  /** Field to filter */
  field: string;
  
  /** Label to show in UI */
  label: string;
  
  /** Icon to display next to filter */
  icon?: string;
  
  /** Available values for filter */
  options: any[];
  
  /** Original complete list of options (used for search/filtering) */
  allOptions?: any[];
  
  /** Selected values */
  selectedValues: any[];
  
  /** Placeholder for filter */
  placeholder?: string;
}

/**
 * Interfaz para eventos de cambio en filtros
 */
export interface FilterChangeEvent {
  /** Campo que fue filtrado */
  field: string;
  
  /** Valores seleccionados */
  values: string[];
}

/**
 * Interfaz para parámetros de filtrado
 */
export interface FilterParams {
  /** Filtros por columna */
  columnFilters: { [key: string]: string[] };
  
  /** Filtro global */
  globalFilter: string;
}
