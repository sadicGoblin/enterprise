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
  page: number;
  
  /** Número de filas por página */
  pageSize: number;
}
