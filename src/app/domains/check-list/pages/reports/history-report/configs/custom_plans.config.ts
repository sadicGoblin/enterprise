import { GlobalReportsConfig } from '../models/report-config.model';

/**
 * Default configuration for all available reports in the application
 */
export const REPORTS_CONFIG: GlobalReportsConfig = {
  // Default color palette for all reports if not specified otherwise - Modern tones
  defaultColors: [
    '#3498db', '#e67e22', '#2ecc71', '#f1c40f', '#9b59b6',
    '#e74c3c', '#27ae60', '#2980b9', '#d35400', '#7f8c8d',
    '#f39c12', '#bdc3c7', '#3498db', '#c0392b', '#1abc9c'
  ],
  
  reports: [
    {
      indexName: 'history-report',
      principalValue: 'estado',
      principalValuePositive: 'cumplida',
      summaryValues: ['estado', 'tipo'],
      unit: 'percent',
      chartColors: [
        { indexItem: 'cumplida', color: '#2ecc71' },    // Verde más moderno
        { indexItem: 'no cumplida', color: '#e74c3c' }, // Rojo más moderno
        { indexItem: 'pendiente', color: '#f1c40f' }    // Amarillo más moderno
      ],
      columnsExport: ['fecha', 'Usuario', 'Cargo', 'Obra', 'Periodo', 'EtapaConst', 'SubProceso', 'Ambito', 'Actividad', 'Periocidad', 'tipo', 'estado'],
      columnsTable: ['fecha', 'Usuario', 'Cargo', 'Obra', 'Periodo', 'EtapaConst', 'SubProceso', 'Ambito', 'Actividad', 'Periocidad', 'tipo', 'estado'],
      columnsFilter: ['Obra', 'Cargo', 'Usuario', 'fecha', 'Periodo', 'EtapaConst', 'SubProceso', 'Ambito', 'Actividad', 'Periocidad', 'tipo', 'estado'],
      title: 'Reporte Histórico'
    },
    // Additional reports can be added here
  ]
};
