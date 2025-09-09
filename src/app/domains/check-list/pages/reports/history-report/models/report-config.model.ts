/**
 * Interfaz para la configuración de colores de elementos específicos
 */
export interface ColorConfig {
  indexItem: string;  // Valor del item (ej: 'cumplida', 'pendiente')
  color: string;      // Color en hexadecimal
}

/**
 * Configuración para un reporte específico
 */
export interface ReportConfig {
  indexName: string;                // Identificador único del reporte
  principalValue: string;           // Campo principal a mostrar en gráficos (ej: 'estado')
  principalValuePositive?: string;  // Valor del campo principal considerado "positivo" (ej: 'cumplida')
  summaryValues: string[];          // Campos para mostrar en resúmenes (ej: ['estado', 'tipo'])
  unit?: string;                    // Unidad de medida (ej: 'quantity', 'percent')
  chartColors?: ColorConfig[];      // Configuración de colores específicos para valores
  columnsExport?: string[];         // Campos para mostrar en la exportación
  columnsTable?: string[];          // Campos para mostrar en la tabla
  columnsFilter?: string[];         // Campos para mostrar en el filtro
  title?: string;                   // Título opcional del reporte
}

/**
 * Configuración global para todos los reportes disponibles
 */
export interface GlobalReportsConfig {
  reports: ReportConfig[];
  defaultColors?: string[];    // Colores por defecto si no se especifican
}
