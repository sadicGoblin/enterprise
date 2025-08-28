import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importar los nuevos componentes
import { MetricsFilterComponent } from './metrics-filter/metrics-filter.component';
import { MetricsDataComponent } from './metrics-data/metrics-data.component';

@Component({
  selector: 'app-history-metrics',
  templateUrl: './history-metrics.component.html',
  styleUrls: ['./history-metrics.component.scss'],
  standalone: true,
  imports: [CommonModule, MetricsFilterComponent, MetricsDataComponent]
})
export class HistoryMetricsComponent implements OnChanges {
  // Recibir datos del componente padre
  @Input() data: any[] = [];
  
  // Datos filtrados que se pasarán al componente de datos
  filteredData: any[] = [];
  
  // Objeto para guardar filtros aplicados
  activeFilters: {[key: string]: string[]} = {};
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      // Al inicio, los datos filtrados son los mismos que los datos originales
      this.filteredData = [...this.data];
    }
  }
  
  /**
 * Maneja los cambios en los filtros desde el componente de filtro
 * @param filters Objeto con los filtros aplicados por tipo
 */
handleFilterChange(filters: {[key: string]: string[]}) {
  console.log('[HistoryMetricsComponent] handleFilterChange - Filtros recibidos:', filters);
  
  // Verificar si realmente hubo cambios en los filtros para evitar re-renderizado innecesario
  const filtersChanged = this.haveFiltersChanged(this.activeFilters, filters);
  
  if (filtersChanged) {
    console.log('[HistoryMetricsComponent] handleFilterChange - Cambios detectados, actualizando...');
    this.activeFilters = { ...filters }; // Crear una nueva referencia del objeto
    this.applyFilters();
  } else {
    console.log('[HistoryMetricsComponent] handleFilterChange - Sin cambios, ignorando...');
  }
}

/**
 * Compara dos objetos de filtro para determinar si son diferentes
 */
private haveFiltersChanged(oldFilters: {[key: string]: string[]}, newFilters: {[key: string]: string[]}): boolean {
  // Verificar si tienen diferente número de claves
  const oldKeys = Object.keys(oldFilters);
  const newKeys = Object.keys(newFilters);
  
  if (oldKeys.length !== newKeys.length) {
    return true;
  }
  
  // Verificar si alguna clave es diferente
  for (const key of newKeys) {
    // Si la clave no existe en oldFilters
    if (!oldFilters[key]) {
      return true;
    }
    
    // Si tienen diferente número de valores
    if (oldFilters[key].length !== newFilters[key].length) {
      return true;
    }
    
    // Verificar si los valores son diferentes
    for (const value of newFilters[key]) {
      if (!oldFilters[key].includes(value)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Aplica los filtros a los datos y actualiza filteredData
 */
applyFilters(): void {
  // Performance: Guardar la cantidad de filtros para no calcularlo en cada iteración
  const filterEntries = Object.entries(this.activeFilters);
  const hasActiveFilters = filterEntries.length > 0;
  
  if (!hasActiveFilters) {
    // Si no hay filtros activos, mostrar todos los datos (crear nueva referencia)
    this.filteredData = [...this.data];
    return;
  }
  
  // Crear mapeo de campos una sola vez antes del filtro para mejorar rendimiento
  const fieldMappings: {[key: string]: string} = {};
  filterEntries.forEach(([filterType]) => {
    fieldMappings[filterType] = this.getFieldNameByFilterType(filterType);
  });
  
  // Agregar logs para verificar los valores de filtro
  console.log('[HistoryMetricsComponent] applyFilters - Campos de filtro:', fieldMappings);
  console.log('[HistoryMetricsComponent] applyFilters - Valores seleccionados:', this.activeFilters);
  
  // Ejemplo del primer elemento para depurar
  if (this.data.length > 0) {
    console.log('[HistoryMetricsComponent] applyFilters - Ejemplo del primer registro:', this.data[0]);
  }
  
  // Búsqueda de campos insensible a mayúsculas/minúsculas
  const findFieldCaseInsensitive = (item: any, fieldName: string): any => {
    // Primero intentar con el nombre exacto del campo
    if (item[fieldName] !== undefined) {
      return item[fieldName];
    }
    
    // Si no existe, buscar un campo con el mismo nombre pero diferente capitalización
    const fieldNameLower = fieldName.toLowerCase();
    for (const key of Object.keys(item)) {
      if (key.toLowerCase() === fieldNameLower) {
        return item[key];
      }
    }
    
    return undefined;
  };
  
  // Filtrar los datos según los criterios seleccionados
  this.filteredData = this.data.filter((item, idx) => {
    // Debe cumplir con TODOS los grupos de filtros
    const result = filterEntries.every(([filterType, selectedValues]) => {
      const fieldName = fieldMappings[filterType];
      const fieldValue = findFieldCaseInsensitive(item, fieldName);
      
      // Analizar los primeros elementos para depuración
      if (idx === 0) {
        console.log(`[HistoryMetricsComponent] Comparando ${filterType}:`, { 
          campo: fieldName,
          valorEnDatos: fieldValue,
          valoresSeleccionados: selectedValues,
          coincide: fieldValue ? selectedValues.includes(fieldValue) : false
        });
      }
      
      // Si el campo no existe en el item, no coincide con el filtro
      if (fieldValue === undefined || fieldValue === null) return false;
      
      // El item debe coincidir con al menos uno de los valores seleccionados
      return selectedValues.includes(fieldValue);
    });
    
    return result;
  });
  
  console.log(`[HistoryMetricsComponent] applyFilters - Filtrados ${this.filteredData.length} de ${this.data.length} registros`);
}

  // Mapear el tipo de filtro a la propiedad del objeto de datos
private getFieldNameByFilterType(filterType: string): string {
  console.log(`[HistoryMetricsComponent] getFieldNameByFilterType - Mapeando tipo '${filterType}'`);
  const mapping: {[key: string]: string} = {
    'tipo': 'tipo',
    'estado': 'estado',
    'obra': 'obra',
    'usuario': 'usuario'
  };
  const resultado = mapping[filterType.toLowerCase()] || filterType.toLowerCase();
  console.log(`[HistoryMetricsComponent] getFieldNameByFilterType - Resultado: '${resultado}'`);
  return resultado;
}  
}
