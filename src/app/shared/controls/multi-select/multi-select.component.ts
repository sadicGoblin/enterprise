import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, ViewEncapsulation, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, map, startWith } from 'rxjs';
import { getInputIcon } from '../../configs/icons.config';
import { HierarchicalFilterItem } from '../../../domains/check-list/models/hierarchical-filter.model';
import { filter as _filter, cloneDeep } from 'lodash';

// Interfaces
export interface MultiSelectItem {
  value: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  count?: number;
}

@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class MultiSelectComponent implements OnChanges, AfterViewInit {
  // Traditional item-based input (for backwards compatibility)
  @Input() items: MultiSelectItem[] = [];
  
  // New data-driven approach
  @Input() rawData: any[] = [];       // Raw unprocessed data
  @Input() filterField: string = '';  // Field name to filter by
  
  @Input() placeholder = 'Seleccionar...';
  @Input() label = '';
  @Input() showCount = true;
  @Input() useAutocomplete = false;
  @Input() expanded = false;
  @Input() maxHeight = '250px';
  @Input() hierarchicalFilters: HierarchicalFilterItem[] = [];
  
  // Group/section header properties
  @Input() groupName = '';
  @Input() groupIcon = '';
  @Input() showHeader = true;
  @Input() selectedCount = 0;  // This will be calculated internally when using rawData
  
  @Output() selectionChange = new EventEmitter<MultiSelectItem[]>();
  
  // Almacenar la última cantidad de elementos emitidos para optimizar
  private _lastEmitLength: number = 0;
  
  filteredItems: Observable<MultiSelectItem[]>;
  searchControl = new FormControl('');
  rawDataFiltered: any[] = []; 
  
  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
    this.filteredItems = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterItems(value))
    );
  }
  
  // Arreglo interno para mantener nuestros propios items sin modificar el @Input
  private _internalItems: MultiSelectItem[] = [];
  
  // Getter público para que el template pueda acceder al arreglo interno
  get internalItems(): MultiSelectItem[] {
    return this._internalItems;
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Process raw data if provided
    // console.log('Changes:', changes);
    if (changes['rawData'] && this.rawData && this.rawData.length > 0 && this.filterField) {
      this.processRawData();
    }
    
    if (changes['hierarchicalFilters']) {
      // Store original data to avoid data loss when filtering
      // this.hierarchicalFilters = [...this.hierarchicalFilters];
      this.processRawData();
      
    }
    
    // We no longer automatically determine whether to use autocomplete
    // We'll always use a list with search functionality
    if (changes['useAutocomplete'] === undefined) {
      this.useAutocomplete = false;
    }
    
  }

  processFilterHierarchical(rawData: any[] = []) {
    console.log('processFilterHierarchical', this.filterField, this.hierarchicalFilters);
    let rawDataFiltered: any[] = []; 
    rawDataFiltered = [...rawData];
    if (this.hierarchicalFilters && this.hierarchicalFilters.length > 0) {
      // Start with a copy of all raw data
      
      let rawDataResult: any[] = []; 
      
      console.log('rawDataFiltered', rawDataFiltered);
      
      // Sort filters by position to ensure proper hierarchy
      const sortedFilters = [...this.hierarchicalFilters].sort((a, b) => a.position - b.position);
      
      // Apply each filter in order using for...of to allow break statements
      for (const filter of sortedFilters) {
        if (filter.filters && filter.filters.length > 0) {
          console.log('filter', filter);
          const filterType = filter.filterType;
          const filters = filter.filters;
          const position = filter.position;
          console.log('filterType', filterType, this.groupName);
          
          // Stop all filtering if we hit the current field name to avoid circular filtering
          if(String(filterType) === String(this.groupName)){
            break; // Exit the loop completely
          }

          // Apply the filter and store the result
          const filteredData = _filter(rawDataFiltered, item => {
            return filters.includes(item[filterType]);
          });

          // Update for next iteration
          rawDataFiltered = filteredData;
        }
      }

      

      // this.rawData = rawDataFiltered;
      
      // Log the filtered results
      // console.log('Raw data filtered by hierarchical filters:', this.filterField, this.rawData);
    } 
    console.log('rawDataResult', this.filterField, rawDataFiltered);
    return rawDataFiltered;
  }


   /**
   * Processes raw data to generate MultiSelectItems
   * This method analyzes the raw data, extracts unique values for the specified field,
   * counts occurrences, and generates MultiSelectItems
   */
   private processRawData(): void {
    if (!this.rawData || !this.filterField) return;
    let rawDataFiltered: any[] = []; 
    rawDataFiltered = this.processFilterHierarchical(this.rawData);
    
    // Count occurrences of each unique value
    const valueCountMap = new Map<string, number>();
    
    // Process each data item
    rawDataFiltered.forEach(item => {
      // Try to find the field by its exact name first
      let fieldValue = this.getFieldValue(item, this.filterField);
      // console.log('## fieldValue', this.filterField, fieldValue);
      
      // If not found, try case-insensitive search for the field name
      if (fieldValue === null || fieldValue === undefined) {
        // Find the actual property name in the item regardless of case
        const actualFieldName = Object.keys(item).find(
          key => key.toLowerCase() === this.filterField.toLowerCase()
        );
        // console.log('##actualFieldName', actualFieldName);
        
        // If we found a matching field name with different case, get its value
        if (actualFieldName) {
          fieldValue = item[actualFieldName];
        }
        // console.log('## fieldValue', this.filterField, fieldValue);
      }
      
      // Skip if still null or undefined
      if (fieldValue === null || fieldValue === undefined) return;
      
      // Convert to string and normalize
      const value = String(fieldValue).trim();
      if (!value) return;
      
      // Count occurrences 
      valueCountMap.set(value, (valueCountMap.get(value) || 0) + 1);
    });
    
    // Save the selection state of existing items before creating new ones
    const selectedValues = new Set<string>();
    this._internalItems.forEach(item => {
      if (item.selected) {
        selectedValues.add(item.value);
      }
    });

    // Convert to MultiSelectItems preserving previous selection state
    const newItems: MultiSelectItem[] = [];
    valueCountMap.forEach((count, value) => {
      // Check if this value was previously selected
      const wasSelected = selectedValues.has(value);
      
      newItems.push({
        value: value,
        label: value,
        count: count,
        selected: wasSelected // Preserve selection state
      });
    });
    
    // Sort items alphabetically
    newItems.sort((a, b) => a.label.localeCompare(b.label));
    
    // Update internal items
    this._internalItems = newItems;
    
    // Update filtered items
    this.searchControl.setValue(this.searchControl.value);
    
    // Reset emission counter
    this._lastEmitLength = 0;
    
    // Update the selectedCount for the header
    this.updateSelectedCount();
    
    // Apply styles
    setTimeout(() => this.applyLabelStyles(), 100);
  }
  
  filterItems(value: string | null): MultiSelectItem[] {
    if (!value) return this._internalItems;
    const filterValue = value.toLowerCase();
    return this._internalItems.filter(item => 
      item.label.toLowerCase().includes(filterValue));
  }
  
  toggleSelection(item: MultiSelectItem): void {
    if (item.disabled) return;
    
    // Find the item in the internal collection and change its state
    const internalItem = this._internalItems.find(i => i.value === item.value);
    if (internalItem) {
      internalItem.selected = !internalItem.selected;
      
      // Update the selected count for the header
      this.updateSelectedCount();
      
      this.emitSelection();
    }
  }
  
  isAllSelected(): boolean {
    return this._internalItems.length > 0 && 
           this._internalItems.filter(item => !item.disabled).every(item => item.selected);
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    this.applyLabelStyles();
  }
  
  toggleAll(): void {
    const allSelected = this.isAllSelected();
    
    // Change the state of all non-disabled elements
    this._internalItems.forEach(item => {
      if (!item.disabled) {
        item.selected = !allSelected;
      }
    });
    
    // Limpiar la búsqueda
    this.searchControl.setValue('');
    
    // Update the selected count for the header
    this.updateSelectedCount();
    
    // Emit changes directly without generating multiple events
    const selectedItems = this._internalItems.filter(item => item.selected);
    this._lastEmitLength = selectedItems.length;
    this.selectionChange.emit(selectedItems);
  }
  
  clearSelection(): void {
    let changed = false;
    this._internalItems.forEach(item => {
      if (!item.disabled && item.selected) {
        item.selected = false;
        changed = true;
      }
    });
    if (changed) {
      this.searchControl.setValue('');
      
      // Update the selected count for the header
      this.updateSelectedCount();
      
      this.emitSelection();
    }
  }
  
  getSelectedItems(): MultiSelectItem[] {
    return this._internalItems.filter(item => item.selected);
  }
  
  getSelectedCount(): number {
    return this.getSelectedItems().length;
  }
  
  removeSelected(item: MultiSelectItem): void {
    const internalItem = this._internalItems.find(i => i.value === item.value);
    if (internalItem) {
      internalItem.selected = false;
      
      // Actualizar el contador de selecciones para el encabezado
      this.updateSelectedCount();
      
      this.emitSelection();
    }
  }
  
  private emitSelection(): void {
    // Obtener solo los items seleccionados y emitirlos
    const selectedItems = this.getSelectedItems();
    
    // Siempre emitir la selección actual para garantizar que se propaga
    this._lastEmitLength = selectedItems.length;
    // console.log('[MultiSelectComponent] emitSelection - Emitiendo', selectedItems.length, 'items seleccionados:', selectedItems);
    
    // Emitir siempre para asegurar que los receptores reciben la información
    this.selectionChange.emit(selectedItems);
    
    // Agregar un log adicional para confirmar que el evento fue emitido
    // console.log('[MultiSelectComponent] emitSelection - Evento emitido correctamente');
  }
  
  /**
   * Determina si un texto excede las dos líneas y debe mostrar un tooltip
   * @param text El texto a evaluar
   * @returns true si el texto probablemente necesita un tooltip
   */
  ngAfterViewInit() {
    setTimeout(() => {
      this.applyLabelStyles();
    });
  }

  private applyLabelStyles() {
    // Usar setTimeout para asegurarnos de aplicar los estilos después del renderizado
    setTimeout(() => {
      // console.log('Aplicando estilos a los elementos del multi-select');
      
      // 1. CONTENEDOR PRINCIPAL
      const optionsContainer = this.elementRef.nativeElement.querySelector('.options-container');
      if (optionsContainer) {
        this.renderer.setStyle(optionsContainer, 'padding', '0');
        this.renderer.setStyle(optionsContainer, 'width', '100%');
        this.renderer.setStyle(optionsContainer, 'overflow-x', 'hidden');
      }
      
      // Estilos para la opción "Ver todos" fija (fuera del scroll)
      const allOptionFixed = this.elementRef.nativeElement.querySelector('.multi-select-all-option-fixed');
      if (allOptionFixed) {
        // Layout y estructura
        this.renderer.setStyle(allOptionFixed, 'display', 'flex');
        this.renderer.setStyle(allOptionFixed, 'align-items', 'center');
        this.renderer.setStyle(allOptionFixed, 'padding', '0px');
        
        // Dimensiones
        this.renderer.setStyle(allOptionFixed, 'width', '100%');
        this.renderer.setStyle(allOptionFixed, 'box-sizing', 'border-box');
        this.renderer.setStyle(allOptionFixed, 'min-height', '30px');
        
        // Estilizar el contenedor
        const verTodosContainer = allOptionFixed.querySelector('.ver-todos-container');
        if (verTodosContainer) {
          this.renderer.setStyle(verTodosContainer, 'display', 'flex');
          this.renderer.setStyle(verTodosContainer, 'align-items', 'center');
          this.renderer.setStyle(verTodosContainer, 'width', '100%');
          this.renderer.setStyle(verTodosContainer, 'border-bottom', '1px solid #ccc');
        }
        
        // Estilos del checkbox dentro de Ver todos
        const checkbox = allOptionFixed.querySelector('mat-checkbox');
        if (checkbox) {
          this.renderer.setStyle(checkbox, 'transform', 'scale(0.8)');
          this.renderer.setStyle(checkbox, 'margin-left', '0');
        }

        // Aplicar estilos al texto "VER TODOS" directamente
        const verTodosText = allOptionFixed.querySelector('.ver-todos-text');
        if (verTodosText) {
          this.renderer.setStyle(verTodosText, 'font-size', '10px');
          this.renderer.setStyle(verTodosText, 'font-weight', '500');
          this.renderer.setStyle(verTodosText, 'color', '#333');
          this.renderer.setStyle(verTodosText, 'line-height', '1.3');
          this.renderer.setStyle(verTodosText, 'margin-left', '8px');
          this.renderer.setStyle(verTodosText, 'cursor', 'pointer');
        }
      }
      
      // // 2. ELEMENTOS DEL LISTADO (ITEMS)
      const optionItems = this.elementRef.nativeElement.querySelectorAll('.multi-select-option');
      optionItems.forEach((item: HTMLElement) => {
        // Estructura y layout del item
        this.renderer.setStyle(item, 'display', 'flex');
        this.renderer.setStyle(item, 'align-items', 'center');
        this.renderer.setStyle(item, 'justify-content', 'flex-start');
        this.renderer.setStyle(item, 'padding', '3px');
        this.renderer.setStyle(item, 'padding-left', '0');
        this.renderer.setStyle(item, 'margin', '0');
        
        // // Dimensiones
        // this.renderer.setStyle(item, 'height', '30px');
        this.renderer.setStyle(item, 'min-height', '30px');
        this.renderer.setStyle(item, 'width', '100%');
        this.renderer.setStyle(item, 'max-width', '100%');
        this.renderer.setStyle(item, 'overflow', 'hidden');
        this.renderer.setStyle(item, 'box-sizing', 'border-box');
        this.renderer.setStyle(item, 'position', 'relative'); 
        // // Para posicionar contador absolutamente
      });
      
      // // 4. CHECKBOXES
      const checkboxes = this.elementRef.nativeElement.querySelectorAll('mat-checkbox');
      checkboxes.forEach((checkbox: HTMLElement) => {
        // Tamaño y posicionamiento
        this.renderer.setStyle(checkbox, 'width', '24px');
        this.renderer.setStyle(checkbox, 'min-width', '24px');
        this.renderer.setStyle(checkbox, 'display', 'inline-block');
        this.renderer.setStyle(checkbox, 'transform', 'scale(0.8)');
        this.renderer.setStyle(checkbox, 'margin-left', '0px');
        this.renderer.setStyle(checkbox, 'padding-left', '0');
        this.renderer.setStyle(checkbox, 'margin-right', '0');
      });

      // // 6. ETIQUETAS DE LOS CHECKBOXES
      const labels = this.elementRef.nativeElement.querySelectorAll('.checkbox-label');
      labels.forEach((label: HTMLElement) => {
        // Dimensiones y ancho
        this.renderer.setStyle(label, 'width', 'calc(100% - 60px)');
        this.renderer.setStyle(label, 'min-width', '120px');
        this.renderer.setStyle(label, 'max-width', '240px');
        
        // Estilos de texto
        this.renderer.setStyle(label, 'font-size', '12px');
        this.renderer.setStyle(label, 'font-weight', '500');
        this.renderer.setStyle(label, 'color', '#333');
        this.renderer.setStyle(label, 'line-height', '1.3');
        
        // Truncamiento y multi-línea
        this.renderer.setStyle(label, 'white-space', 'normal');
        this.renderer.setStyle(label, 'display', '-webkit-box');
        this.renderer.setStyle(label, '-webkit-line-clamp', '2');
        this.renderer.setStyle(label, '-webkit-box-orient', 'vertical');
        this.renderer.setStyle(label, 'overflow', 'hidden');
        this.renderer.setStyle(label, 'text-overflow', 'ellipsis');
      });
      
      // // 8. CONTADORES (badges)
      const counts = this.elementRef.nativeElement.querySelectorAll('.multi-select-count');
      counts.forEach((count: HTMLElement) => {
        // Dimensiones y posicionamiento
        this.renderer.setStyle(count, 'position', 'absolute');
        this.renderer.setStyle(count, 'right', '8px');
        this.renderer.setStyle(count, 'top', '50%');
        this.renderer.setStyle(count, 'transform', 'translateY(-50%)');
        
        // Ancho fijo
        this.renderer.setStyle(count, 'width', '30px');
        this.renderer.setStyle(count, 'min-width', '30px');
        this.renderer.setStyle(count, 'text-align', 'right');
        
        // Estilo del texto
        this.renderer.setStyle(count, 'color', '#999');
        this.renderer.setStyle(count, 'font-size', '9px');
      });
      
      // Estilos para el mensaje "Y X elementos más..."
      const moreText = this.elementRef.nativeElement.querySelector('.more-text');
      if (moreText) {
        this.renderer.setStyle(moreText, 'font-size', '10px');
        this.renderer.setStyle(moreText, 'color', '#000');
        this.renderer.setStyle(moreText, 'font-weight', '400');
      }
      
      // Icono del mensaje de más elementos
      const moreIcon = this.elementRef.nativeElement.querySelector('.more-icon');
      if (moreIcon) {
        this.renderer.setStyle(moreIcon, 'font-size', '14px');
        this.renderer.setStyle(moreIcon, 'height', '14px');
        this.renderer.setStyle(moreIcon, 'width', '14px');
      }
    }, 0);
  }

  isTextOverflowing(text: string): boolean {
    // Estimación basada en la longitud del texto
    // Asumimos que una línea típica puede contener aproximadamente 20 caracteres
    return text.length > 40;
  }
  
  /**
   * Gets the icon name from the centralized icon dictionary
   * @param key The icon key to look up
   * @returns The Material icon name
   */
  getIconName(key: string): string {
    return getInputIcon(key);
  }
  
 
  
  /**
   * Safely gets a field value from an object, supporting nested paths with dot notation
   * @param item The data object
   * @param fieldPath The field path (e.g. 'user.name' or just 'name')
   * @returns The field value or null if not found
   */
  private getFieldValue(item: any, fieldPath: string): any {
    if (!item || !fieldPath) return null;
    
    // Handle nested paths (e.g. 'user.name')
    const parts = fieldPath.split('.');
    let value = item;
    
    for (const part of parts) {
      if (value === null || value === undefined) return null;
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Updates the selectedCount property based on internal selection state
   */
  private updateSelectedCount(): void {
    this.selectedCount = this.getSelectedItems().length;
  }
}
