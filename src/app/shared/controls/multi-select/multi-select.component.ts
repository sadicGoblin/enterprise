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
  @Input() items: MultiSelectItem[] = [];
  @Input() placeholder = 'Seleccionar...';
  @Input() label = '';
  @Input() showCount = false;
  @Input() useAutocomplete = false;
  @Input() expanded = true;
  @Input() maxHeight = '250px';
  
  @Output() selectionChange = new EventEmitter<MultiSelectItem[]>();
  
  // Almacenar la última cantidad de elementos emitidos para optimizar
  private _lastEmitLength: number = 0;
  
  filteredItems: Observable<MultiSelectItem[]>;
  searchControl = new FormControl('');
  
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
    if (changes['items'] && this.items) {
      // En lugar de modificar this.items, trabajamos con _internalItems
      this._internalItems = this.items.map(item => ({
        ...item,
        selected: item.selected || false
      }));
      
      // Actualizar items filtrados
      this.searchControl.setValue(this.searchControl.value);
      
      // Reset del contador de emisiones
      this._lastEmitLength = this.getSelectedItems().length;
      
      // Aplicar estilos cuando cambien los items
      setTimeout(() => this.applyLabelStyles(), 100);
    }
    
    // Ya no determinamos automáticamente si usar autocomplete, siempre usaremos lista con buscador
    // El autocomplete como tal ya no lo usamos
    if (changes['useAutocomplete'] === undefined) {
      this.useAutocomplete = false;
    }
    
    if (changes['expanded'] && this.expanded) {
      // Cuando se expande el componente, aplicar estilos
      setTimeout(() => this.applyLabelStyles(), 100);
    }
  }
  
  filterItems(value: string | null): MultiSelectItem[] {
    if (!value) return this._internalItems;
    const filterValue = value.toLowerCase();
    return this._internalItems.filter(item => 
      item.label.toLowerCase().includes(filterValue));
  }
  
  toggleSelection(item: MultiSelectItem): void {
    console.log('[MultiSelectComponent] toggleSelection - Item seleccionado:', item);
    if (item.disabled) return;
    
    // Buscar el item en la colección interna y cambiar su estado
    const internalItem = this._internalItems.find(i => i.value === item.value);
    if (internalItem) {
      internalItem.selected = !internalItem.selected;
      console.log('[MultiSelectComponent] toggleSelection - Nuevo estado:', internalItem.selected);
      this.emitSelection();
    } else {
      console.log('[MultiSelectComponent] toggleSelection - ALERTA: No se encontró el item en _internalItems');
    }
  }
  
  isAllSelected(): boolean {
    return this._internalItems.length > 0 && 
           this._internalItems.filter(item => !item.disabled).every(item => item.selected);
  }
  
  toggleAll(): void {
    console.log('[MultiSelectComponent] toggleAll - Inicio');
    const allSelected = this.isAllSelected();
    console.log('[MultiSelectComponent] toggleAll - Estado actual:', allSelected ? 'Todos seleccionados' : 'No todos seleccionados');
    
    // Cambiar el estado de todos los elementos (no deshabilitados)
    this._internalItems.forEach(item => {
      if (!item.disabled) {
        item.selected = !allSelected;
      }
    });
    
    // Limpiar la búsqueda
    this.searchControl.setValue('');
    
    // Emitir los cambios directamente, sin generar múltiples eventos
    const selectedItems = this._internalItems.filter(item => item.selected);
    console.log('[MultiSelectComponent] toggleAll - Emitiendo selección directamente:', selectedItems);
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
    if (item.disabled) return;
    
    const foundItem = this._internalItems.find(i => i.value === item.value);
    if (foundItem) {
      foundItem.selected = false;
      this.emitSelection();
    }
  }
  
  private emitSelection(): void {
    // Obtener solo los items seleccionados y emitirlos
    const selectedItems = this.getSelectedItems();
    
    // Siempre emitir la selección actual para garantizar que se propaga
    this._lastEmitLength = selectedItems.length;
    console.log('[MultiSelectComponent] emitSelection - Emitiendo', selectedItems.length, 'items seleccionados:', selectedItems);
    
    // Emitir siempre para asegurar que los receptores reciben la información
    this.selectionChange.emit(selectedItems);
    
    // Agregar un log adicional para confirmar que el evento fue emitido
    console.log('[MultiSelectComponent] emitSelection - Evento emitido correctamente');
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
      console.log('Aplicando estilos a los elementos del multi-select');
      
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
      
      // 3. OPCIÓN "VER TODOS"
      // const allOption = this.elementRef.nativeElement.querySelector('.multi-select-all-option-fixed');
      // if (allOption) {
      //   // Estructura y layout
      //   this.renderer.setStyle(allOption, 'font-size', '12px');
      //   this.renderer.setStyle(allOption, 'font-weight', '500');
      //   this.renderer.setStyle(allOption, 'color', '#333');
      //   this.renderer.setStyle(allOption, 'line-height', '1.3');
      //   this.renderer.setStyle(allOption, 'display', 'flex');
      //   this.renderer.setStyle(allOption, 'align-items', 'center');
      //   this.renderer.setStyle(allOption, 'justify-content', 'flex-start');
      //   this.renderer.setStyle(allOption, 'padding', '8px');
      //   this.renderer.setStyle(allOption, 'margin', '8px');
        
      //   // Dimensiones
      //   this.renderer.setStyle(allOption, 'height', '30px');
      //   this.renderer.setStyle(allOption, 'min-height', '30px');
      //   this.renderer.setStyle(allOption, 'width', '100%');
      //   this.renderer.setStyle(allOption, 'max-width', '100%');
      //   this.renderer.setStyle(allOption, 'overflow', 'hidden');
      //   this.renderer.setStyle(allOption, 'box-sizing', 'border-box');
      //   this.renderer.setStyle(allOption, 'position', 'relative');
      // }
      
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
        
      //   // Eliminar todos los márgenes y paddings internos
      //   // const elements = checkbox.querySelectorAll('*');
      //   // for (let i = 0; i < elements.length; i++) {
      //   //   const el = elements[i] as HTMLElement;
      //   //   if (el && el.style) {
      //   //     this.renderer.setStyle(el, 'margin-left', '0');
      //   //     this.renderer.setStyle(el, 'padding-left', '0');  
      //   //   }
      //   // }
        
      //   // Contenedor interno del checkbox
      //   const checkboxInner = checkbox.querySelector('.mat-checkbox-inner-container');
      //   if (checkboxInner) {
      //     this.renderer.setStyle(checkboxInner, 'margin-left', '0');
      //     this.renderer.setStyle(checkboxInner, 'margin-right', '0');
      //   }
      // });
      
      // // 5. CHECKBOX DE "VER TODOS" (específico)
      // const allCheckbox = allOption?.querySelector('mat-checkbox');
      // if (allCheckbox) {
      //   this.renderer.setStyle(allCheckbox, 'width', '24px');
      //   this.renderer.setStyle(allCheckbox, 'min-width', '24px');
      //   this.renderer.setStyle(allCheckbox, 'display', 'inline-block');
      //   this.renderer.setStyle(allCheckbox, 'margin-left', '-16px');
        
      //   // Eliminar márgenes y paddings internos
      //   const elements = allCheckbox.querySelectorAll('*');
      //   for (let i = 0; i < elements.length; i++) {
      //     const el = elements[i] as HTMLElement;
      //     if (el && el.style) {
      //       this.renderer.setStyle(el, 'margin-left', '0');
      //       this.renderer.setStyle(el, 'padding-left', '0');  
      //     }
      //   }
      // }
      
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
        
      //   // Márgenes
      //   this.renderer.setStyle(label, 'margin-left', '-6px');
      //   this.renderer.setStyle(label, 'padding-left', '0');
      // });
      
      // // 7. ETIQUETA DE "VER TODOS" (específico)
      // const allLabel = allCheckbox?.querySelector('.mat-checkbox-label');
      // if (allLabel) {
      //   this.renderer.setStyle(allLabel, 'width', 'calc(100% - 30px)');
      //   this.renderer.setStyle(allLabel, 'min-width', '120px');
      //   this.renderer.setStyle(allLabel, 'margin-left', '-6px');
      //   this.renderer.setStyle(allLabel, 'padding-left', '0');
      // }
      
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
}
