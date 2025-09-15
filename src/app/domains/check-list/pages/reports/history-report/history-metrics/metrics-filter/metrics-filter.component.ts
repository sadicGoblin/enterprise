import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getFieldIcon } from '../../../../../../../shared/configs/icons.config';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MultiSelectComponent, MultiSelectItem } from '../../../../../../../shared/controls/multi-select/multi-select.component';
import { HierarchicalFilterItem } from '../../../../../models/hierarchical-filter.model';

/**
 * Interface for simplified filter group and multi-select options
 * This contains all properties needed by the multi-select component
 */
interface FilterGroup {
  name: string;
  icon: string;
  rawData: any[];
  filterField: string;
}

@Component({
  selector: 'app-metrics-filter',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatIconModule, 
    MatDividerModule, 
    MultiSelectComponent
  ],
  templateUrl: './metrics-filter.component.html',
  styleUrl: './metrics-filter.component.scss'
})
export class MetricsFilterComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columnsFilter: string[] = [];
  @Output() filterChange = new EventEmitter<any>();
  @Output() hierarchicalFiltersChange = new EventEmitter<HierarchicalFilterItem[]>();
  
  // Counter for filters
  totalRegistros: number = 0;
  
  // Filter groups
  filterGroups: FilterGroup[] = [];
  
  // Hierarchical filter system
  hierarchicalFilters: HierarchicalFilterItem[] = [];
  
  // Original data (to avoid data loss when filtering)
  originalData: any[] = [];
  
  constructor() {}
  
  /**
   * Limpia todos los filtros aplicados y todos los ítems seleccionados
   */
  clearAllFilters(): void {
    // Reinicia los filtros jerárquicos
    this.hierarchicalFilters = [];
    
    // Reinicia los filtros en los componentes multi-select
    // Se hace a través de la propagación de cambios de hierarchicalFilters
    // los componentes multi-select detectarán los cambios mediante sus @Input()
    
    // Emite el evento de cambio de filtros jerárquicos vacío
    this.hierarchicalFiltersChange.emit([]);
    
    // También reinicializa los filterGroups para una limpieza completa
    this.initializeFilters();
  }
  
  /**
   * When input changes, initialize filters and process data
   */
  ngOnChanges(changes: SimpleChanges): void {
    
    if (changes['data'] && this.data) {
      // Store original data to avoid data loss when filtering
      this.originalData = [...this.data];
      this.totalRegistros = this.data.length;
      this.initializeFilters();
    }
  }
  
  /**
   * Returns the icon name for a given field using the centralized icon config
   * @param fieldName Field name to get icon for
   */
  getFieldIconName(fieldName: string): string {
    return getFieldIcon(fieldName);
  }
  
  /**
   * Initializes filter groups based on columnsFilter or available string fields
   */
  initializeFilters(): void {
    this.filterGroups = [];
    
    // Exit if no data available
    if (!this.data || this.data.length === 0) return;
    
    // Determine which fields to show based on columnsFilter
    let fieldsToShow = [];
    
    if (this.columnsFilter && this.columnsFilter.length > 0) {
      // Only use fields specified in columnsFilter
      fieldsToShow = this.columnsFilter.filter(field => {
        // Verify the field exists in the data as a string type
        return this.data.some(item => 
          item[field] !== undefined && 
          typeof item[field] === 'string' && 
          item[field] !== null && 
          item[field].trim() !== ''
        );
      });
    } else {
      // If columnsFilter is not specified, use previous behavior
      const firstItem = this.data[0];
      fieldsToShow = Object.keys(firstItem).filter(key => {
        // Exclude fields starting with 'Id'
        if (key.startsWith('Id') || key.startsWith('id')) {
          return false;
        }
        return this.data.some(item => 
          typeof item[key] === 'string' && item[key] !== null && item[key].trim() !== ''
        );
      });
    }
    
    // Create a filter group for each field
    fieldsToShow.forEach(field => {
      // Create a simple group structure - data processing is now handled by multi-select
      // Convert field name to display name (first letter uppercase)
      const fieldDisplayName = field.charAt(0).toUpperCase() + field.slice(1);
      
      // Get appropriate icon for this field
      const icon = this.getFieldIconName(field);
      
      // Create filter group with minimal information
      this.createSimpleFilterGroup(fieldDisplayName, icon);
    });
    
    // Sort filter groups based on their position in columnsFilter if defined
    if (this.columnsFilter && this.columnsFilter.length > 0) {
      this.filterGroups.sort((a, b) => {
        const indexA = this.columnsFilter.findIndex(field => 
          field.toLowerCase() === a.name.toLowerCase());
        const indexB = this.columnsFilter.findIndex(field => 
          field.toLowerCase() === b.name.toLowerCase());
        return indexA - indexB;
      });
    }
  }
  
  /**
   * Creates a simple filter group with just name and icon
   * This is used with the new multi-select component that processes data internally
   * @param name Display name for the filter group
   * @param icon Icon to use for the filter group
   */
  createSimpleFilterGroup(name: string, icon: string): void {
    // Create filter group options object with all needed properties
    const options = {
      name,
      icon,
      rawData: this.originalData,
      filterField: name
    };
    
    // Add to filter groups array
    this.filterGroups.push(options);
  }
  
  // El método toggleExpand() ya no es necesario, ya que el componente multi-select ahora maneja internamente su propio estado
  
  /**
   * Handle selection changes from the multi-select component
   * Updates hierarchical filters based on selections
   * @param selectedItems Selected items from multi-select
   * @param group Filter group that was changed
   */
  handleSelectionChange(selectedItems: MultiSelectItem[], group: FilterGroup): void {
    // Get selected values
    console.log('handleSelectionChange', selectedItems, group);
    const selectedValues = selectedItems
      .filter(item => item.selected)
      .map(item => item.value);

    console.log('handleSelectionChange', selectedValues, group);
    
    // Update hierarchical filters
    this.updateHierarchicalFilters(group.name, selectedValues);
  }
  
  /**
   * Updates the hierarchical filters based on selection changes
   * @param filterType Type of filter (lowercase field name)
   * @param selectedValues Array of selected values
   */
  private updateHierarchicalFilters(filterType: string, selectedValues: string[]): void {
    console.log('updateHierarchicalFilters', filterType, selectedValues);
    // Create a copy of the current filters
    let hierarchicalFiltersTemp = [...this.hierarchicalFilters];
    let selectValuesTemp = [...selectedValues];
    
    if (selectValuesTemp.length === 0) {
      // If no values selected, remove this filter from hierarchy
      hierarchicalFiltersTemp = hierarchicalFiltersTemp.filter(item => 
        item.filterType !== filterType);
    } else {
      // Check if this filter type already exists in the hierarchy
      const existingIndex = hierarchicalFiltersTemp.findIndex(item => 
        item.filterType === filterType);
      
      if (existingIndex >= 0) {
        // Update existing filter
        hierarchicalFiltersTemp[existingIndex].filters = selectValuesTemp;
      } else {
        // Add new filter to hierarchy with next position
        const position = hierarchicalFiltersTemp.length;
        hierarchicalFiltersTemp.push({
          position,
          filterType,
          filters: selectValuesTemp
        });
      }
    }
    
    // Sort by position to ensure correct hierarchy order
    hierarchicalFiltersTemp.sort((a, b) => a.position - b.position);
    
    // Emit the updated hierarchical filters
    console.log('HierarchicalFilters updated:', hierarchicalFiltersTemp);
    this.hierarchicalFiltersChange.emit(hierarchicalFiltersTemp);
    this.hierarchicalFilters = hierarchicalFiltersTemp;
    
    
    // Also emit filtered data for backward compatibility
    // const filteredData = this.applyFiltersToData();
    // console.log('filteredData [MetricsFilterComponent]', filteredData);
    // this.filterChange.emit(selectValuesTemp);
    // console.log('filteredData [MetricsFilterComponent] EMIT', selectValuesTemp);
  }
  
  /**
   * Applies filters to the data
   * @returns Filtered data
   */
  private applyFiltersToData(): any[] {
    // If no hierarchical filters, return all data
    if (this.hierarchicalFilters.length === 0) {
      return this.originalData;
    }
    
    // Apply filters one by one
    let filteredData = [...this.originalData];
    
    this.hierarchicalFilters.forEach(filter => {
      // Skip empty filters
      if (filter.filters.length === 0) return;
      
      filteredData = filteredData.filter(item => 
        filter.filters.includes(item[filter.filterType])
      );
    });
    
    return filteredData;
  }
}
  