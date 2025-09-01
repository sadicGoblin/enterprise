import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MultiSelectComponent, MultiSelectItem } from '../../../../../../../shared/controls/multi-select/multi-select.component';

interface FilterItem {
  label: string;
  count: number;
  selected: boolean;
}

interface FilterGroup {
  name: string;
  icon: string;
  items: FilterItem[];
  searchControl: FormControl;
  filteredItems: Observable<FilterItem[]>;
  expanded: boolean;
  useAutocomplete: boolean;
  multiSelectItems?: MultiSelectItem[];
}

@Component({
  selector: 'app-metrics-filter',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatIconModule, 
    MatDividerModule, 
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MultiSelectComponent
  ],
  templateUrl: './metrics-filter.component.html',
  styleUrl: './metrics-filter.component.scss'
})
export class MetricsFilterComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columnsFilter: string[] = [];
  @Output() filterChange = new EventEmitter<any>();
  
  // Contadores para filtros
  totalRegistros: number = 0;
  
  // Grupos de filtros
  filterGroups: FilterGroup[] = [];
  
  constructor() {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.totalRegistros = this.data.length;
      this.initializeFilters();
    }
  }
  
  initializeFilters(): void {
    this.filterGroups = [];
    
    // Si no hay datos, salir
    if (!this.data || this.data.length === 0) return;
    
    // Determinar qué campos mostrar basado en columnsFilter
    let fieldsToShow = [];
    
    if (this.columnsFilter && this.columnsFilter.length > 0) {
      // Usar solo los campos especificados en columnsFilter
      fieldsToShow = this.columnsFilter.filter(field => {
        // Verificar que el campo existe en los datos
        return this.data.some(item => 
          item[field] !== undefined && 
          typeof item[field] === 'string' && 
          item[field] !== null && 
          item[field].trim() !== ''
        );
      });
    } else {
      // Si no se especifica columnsFilter, usar el comportamiento anterior
      const firstItem = this.data[0];
      fieldsToShow = Object.keys(firstItem).filter(key => {
        // Excluir campos que comiencen con 'Id'
        if (key.startsWith('Id') || key.startsWith('id')) {
          return false;
        }
        return this.data.some(item => 
          typeof item[key] === 'string' && item[key] !== null && item[key].trim() !== ''
        );
      });
    }
    
    fieldsToShow.forEach(field => {
      // Contabilizar valores únicos
      const valueCounts: { [key: string]: number } = {};
      this.data.forEach(item => {
        const value = item[field];
        if (typeof value === 'string' && value !== null && value.trim() !== '') {
          valueCounts[value] = (valueCounts[value] || 0) + 1;
        }
      });
      
      // Crear items para el grupo de filtros
      const items: FilterItem[] = Object.keys(valueCounts)
        .sort() // Ordenar valores alfabéticamente
        .map(value => ({
          label: value,
          count: valueCounts[value],
          selected: false
        }));
      
      // Solo crear grupo si hay al menos un item
      if (items.length > 0) {
        // Note: Ya no usamos este searchControl en la UI, pero lo mantenemos por compatibilidad
        // La búsqueda ahora la maneja internamente el componente multi-select
        const searchControl = new FormControl('');
        const filteredItems = searchControl.valueChanges.pipe(
          startWith(''),
          map(value => this.filterItems(value, items))
        );
        
        // Determinar icono basado en el nombre del campo
        let icon = 'label';
        const fieldLower = field.toLowerCase();
        if (fieldLower.includes('estado')) icon = 'check_circle';
        if (fieldLower.includes('tipo')) icon = 'category';
        if (fieldLower.includes('nombre')) icon = 'person';
        if (fieldLower.includes('ubicacion') || fieldLower.includes('ubicación')) icon = 'place';
        if (fieldLower.includes('fecha')) icon = 'event';
        
        // Determinar si usar autocompletado basado en el número de items
        const useAutocomplete = items.length > 15;
        
        // Crear la versión MultiSelectItem una sola vez
        const multiSelectItems: MultiSelectItem[] = items.map(item => ({
          value: item.label,
          label: item.label,
          selected: item.selected,
          count: item.count
        }));
        
        this.filterGroups.push({
          name: field.charAt(0).toUpperCase() + field.slice(1),
          icon,
          expanded: false,
          items,
          searchControl,
          filteredItems,
          useAutocomplete,
          multiSelectItems
        });
      }
    });
  }
  
  createFilterGroup(name: string, icon: string, dataMap: Map<string, number>): void {
    if (dataMap.size === 0) return;
    
    const items: FilterItem[] = [];
    dataMap.forEach((count, label) => {
      items.push({
        label,
        count,
        selected: false
      });
    });
    
    // Ordenar por frecuencia descendente
    items.sort((a, b) => b.count - a.count);
    
    const searchControl = new FormControl('');
    const useAutocomplete = items.length > 15;
    
    const filteredItems = searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterItems(value, items))
    );
    
    this.filterGroups.push({
      name,
      icon,
      items,
      searchControl,
      filteredItems,
      expanded: false,
      useAutocomplete
    });
  }
  
  filterItems(value: string | null, items: FilterItem[]): FilterItem[] {
    if (!value) return items;
    const filterValue = value.toLowerCase();
    return items.filter(item => item.label.toLowerCase().includes(filterValue));
  }
  
  toggleSelection(item: FilterItem): void {
    item.selected = !item.selected;
    this.applyFilters();
  }
  
  toggleExpand(group: FilterGroup): void {
    group.expanded = !group.expanded;
  }
  
  // Se eliminó el método clearFilters que ya no es necesario
  
  getSelectedCount(group: FilterGroup): number {
    return group.items.filter(item => item.selected).length;
  }
  
  /**
   * Aplica los filtros basados en las selecciones actuales y emite el evento filterChange
   */
  applyFilters(): void {
    const filters: {[key: string]: string[]} = {};
    let hasActiveFilters = false;
    
    this.filterGroups.forEach(group => {
      const selectedItems = group.items
        .filter(item => item.selected)
        .map(item => item.label);
      
      if (selectedItems.length > 0) {
        filters[group.name.toLowerCase()] = selectedItems;
        hasActiveFilters = true;
      }
    });
    
    // Emitir los filtros aplicados
    console.log('[MetricsFilterComponent] applyFilters - Emitiendo filtros:', hasActiveFilters ? filters : {});
    this.filterChange.emit(hasActiveFilters ? filters : {});
  }
  
  /**
   * Devuelve los MultiSelectItems pre-generados del FilterGroup
   */
  getMultiSelectItems(group: FilterGroup): MultiSelectItem[] {
    // Devolver la referencia estable en lugar de crear una nueva cada vez
    return group.multiSelectItems || [];
  }
  
  /**
   * Maneja los cambios de selección del componente multi-select
   */
  handleSelectionChange(selectedItems: MultiSelectItem[], group: FilterGroup): void {
    console.log(`[MetricsFilterComponent] handleSelectionChange - Recibido para grupo '${group.name}'`, selectedItems);
    
    // Verificar si realmente hay cambios para evitar actualizaciones innecesarias
    let hasChanges = false;
    
    // Obtener solo los valores seleccionados
    const selectedValues = new Set(selectedItems.map(item => item.value));
    
    // Actualizar el estado de selección en los items del grupo
    group.items.forEach(item => {
      const shouldBeSelected = selectedValues.has(item.label);
      if (item.selected !== shouldBeSelected) {
        item.selected = shouldBeSelected;
        hasChanges = true;
      }
    });
    
    // Actualizar también los MultiSelectItems del grupo para mantener sincronizado
    if (group.multiSelectItems) {
      group.multiSelectItems.forEach(item => {
        const shouldBeSelected = selectedValues.has(item.value);
        if (item.selected !== shouldBeSelected) {
          item.selected = shouldBeSelected;
        }
      });
    }
    
    // Aplicar los filtros solo si hubo cambios
    if (hasChanges) {
      console.log(`[MetricsFilterComponent] handleSelectionChange - Cambios detectados en grupo '${group.name}', aplicando filtros`);
      this.applyFilters();
    } else {
      console.log(`[MetricsFilterComponent] handleSelectionChange - Sin cambios en grupo '${group.name}', no se aplican filtros`);
    }
  }
}
