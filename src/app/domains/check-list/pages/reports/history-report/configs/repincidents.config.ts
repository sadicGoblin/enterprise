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
      indexName: 'repincidents',
      principalValue: 'cantidad',
      principalValuePositive: '1',
      unit: 'quantity',
      summaryValues: ['potencialGravedad', 'tipoIncidente'],
      chartColors: [
        { indexItem: '1', color: '#2ecc71' },    // Verde más moderno
        { indexItem: '0', color: '#e74c3c' }, // Rojo más moderno
      ],
      columnsExport: ['idReporteIncidente', 'Obra', 'periodo', 'dia', 'fecha', 'potencialGravedad', 'amerita', 'situacionObservada', 'tipoIncidente', 'accionRealizar', 'profesionalResponsable', 'Usuario', 'cargo', 'descripcionAccionRealizar', 'comunicadoA', 'enviado', 'sector', 'ident_causas', 'personas_involucradas', 'riesgoAsociado', 'empresa', 'idControl', 'EtapaConst', 'SubProceso', 'Ambito', 'Actividad'],
      columnsTable: ['Obra', 'fecha','empresa', 'periodo', 'Usuario', 'cargo', 'tipoIncidente', 'riesgoAsociado','potencialGravedad','profesionalResponsable'],
      columnsFilter: ['Obra', 'Usuario', 'cargo', 'tipoIncidente', 'riesgoAsociado','potencialGravedad', 'empresa', 'periodo', 'profesionalResponsable', 'EtapaConst', 'SubProceso', 'Ambito', 'Actividad', 'fecha'],
      title: 'Reporte de Incidentes'
    },
    // Additional reports can be added here
  ]
};
