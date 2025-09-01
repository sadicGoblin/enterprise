import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoricalReportItem } from '../../../../../../core/services/report.service';
import { DataTableComponent } from '../../../../../../shared/controls/datatable/datatable.component';
import { DataTableColumn, DataTableConfig } from '../../../../../../shared/controls/datatable/datatable.models';
import { REPORTS_CONFIG } from '../configs/reports.config';

@Component({
  selector: 'app-history-table',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent
  ],
  templateUrl: './history-table.component.html',
  styleUrls: ['./history-table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HistoryTableComponent implements OnChanges {  
  // Input para recibir los datos de la tabla
  @Input() data: HistoricalReportItem[] = [];
  
  // Variables para la tabla dinámica
  dynamicTableConfig: DataTableConfig = {
    showRowNumber: true,
    selectable: false,
    maxHeight: '60vh',
    pagination: true,
    shadow: true,
    columnSelectLabel: 'Columnas',
    showFilters: true,
    clearFiltersLabel: 'Limpiar filtros',
    selectAllLabel: 'Seleccionar todos',
    globalSearchLabel: 'Búsqueda',
    globalSearchPlaceholder: 'Buscar en todos los campos',
    showToolbar: true,
    clearAllFiltersLabel: 'Limpiar todos los filtros',
    exportExcelLabel: 'Exportar a Excel',
    exportFileName: 'Reporte_Historico'
  };
  
  dynamicTableColumns: DataTableColumn[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue) {
      const data = changes['data'].currentValue;
      // Configurar la tabla dinámica
      this.setupDynamicTable(data);
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
   * Configura la tabla dinámica basada en los datos recibidos
   */
  private setupDynamicTable(data: any[]): void {
    if (!data || data.length === 0) {
      this.dynamicTableColumns = [];
      return;
    }
    
    // Obtener configuración del reporte desde el archivo de configuración global
    const reportConfig = REPORTS_CONFIG.reports.find(report => report.indexName === 'history-report');
    
    // Definir columnas y filtros con valores por defecto si no se encuentra la configuración
    const columnsTableConfig = reportConfig?.columnsTable || [];
    const columnsFilterConfig = reportConfig?.columnsFilter || [];
    
    // Sample data para verificar tipos y propiedades
    const sample = data[0];
    
    // Todas las propiedades disponibles en los datos
    const allProperties = Object.keys(sample);
    
    // Limpiar columnas anteriores
    this.dynamicTableColumns = [];
    
    // Configurar columnas de la tabla según la configuración global o automáticamente
    const columnsToDisplay = columnsTableConfig.length > 0 ? columnsTableConfig : allProperties;
    
    for (const property of columnsToDisplay) {
      // Solo incluir si la propiedad existe en los datos
      if (allProperties.includes(property)) {
        this.dynamicTableColumns.push({
          field: property,
          header: property.charAt(0).toUpperCase() + property.slice(1), // Capitalizar primera letra
          sortable: true,
          filterable: columnsFilterConfig.includes(property), // Marcar como filtrable si está en columnsFilter
          dataType: typeof sample[property] === 'boolean' ? 'boolean' : 'text',
          align: typeof sample[property] === 'number' ? 'right' : 'left'
        });
      }
    }
  }
  
  /**
   * Gets appropriate icon for field based on field name
   */
  getIconForField(field: string): string {
    const lowerField = field.toLowerCase();
    
    if (lowerField.includes('user') || lowerField.includes('usuario')) {
      return 'person';
    }
    if (lowerField.includes('date') || lowerField.includes('fecha')) {
      return 'calendar_today';
    }
    if (lowerField.includes('type') || lowerField.includes('tipo')) {
      return 'label';
    }
    if (lowerField.includes('status') || lowerField.includes('estado')) {
      return 'check_circle';
    }
    if (lowerField.includes('location') || lowerField.includes('ubicacion') || lowerField.includes('obra')) {
      return 'business';
    }
    
    // Default icon
    return 'filter_list';
  }

  /**
   * Handles click event on a table row
   */
  onDynamicRowClick(row: any): void {
    console.log('Selected row:', row);
    // Here you can implement additional actions when clicking on a row
  }
}
