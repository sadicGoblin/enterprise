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
      indexName: 'inspsttma',
      principalValue: 'cantidad',
      principalValuePositive: '1',
      unit: 'quantity',
      summaryValues: ['ambitoInvolucrado', 'empresa'],
      chartColors: [
        { indexItem: '1', color: '#2ecc71' },    // Verde más moderno
        { indexItem: '0', color: '#e74c3c' }, // Rojo más moderno
      ],
      columnsExport: ['idInspeccionSSTMA', 'fecha', 'areaTrabajo', 'accion', 'trabajoAsociado', 'medidaControl', 'comunicadoA', 'correoA',   'Obra', 'periodo', 'empresa', 'profesionalResponsable','usuario', 'ambitoInvolucrado', 'riesgoAsociado'],
      columnsTable: ['idInspeccionSSTMA', 'fecha', 'areaTrabajo', 'accion', 'trabajoAsociado', 'medidaControl', 'comunicadoA', 'correoA',   'Obra', 'periodo', 'empresa', 'profesionalResponsable','usuario', 'ambitoInvolucrado', 'riesgoAsociado'],
      columnsFilter: ['Obra','usuario',  'areaTrabajo', 'accion', 'riesgoAsociado', 'trabajoAsociado', 'medidaControl', 'periodo', 'empresa', 'profesionalResponsable', 'ambitoInvolucrado', 'fecha'],
      title: 'Inspeccion STTMA'
    },
    // Additional reports can be added here
  ]
};
