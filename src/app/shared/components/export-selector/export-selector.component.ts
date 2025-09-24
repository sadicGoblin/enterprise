import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';

export interface ExportableItem {
  id: string;
  name: string;
  icon: string;
  type?: string;
}

@Component({
  selector: 'app-export-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DragDropModule
  ],
  templateUrl: './export-selector.component.html',
  styleUrls: ['./export-selector.component.scss']
})
export class ExportSelectorComponent implements OnInit, OnChanges {
  @Input() exportableItems: ExportableItem[] = [];
  @Input() showToolbar: boolean = true;
  @Input() showSelectedPanel: boolean = true;
  @Input() toolbarTitle: string = 'Exportación Masiva';
  @Input() selectedPanelTitle: string = 'Elementos seleccionados para exportación:';
  @Input() externalSelectedIds: string[] = []; // IDs seleccionados externamente
  @Input() externalSelectedOrder: string[] = []; // Orden de elementos seleccionados externamente
  
  @Output() exportModeChange = new EventEmitter<boolean>();
  @Output() selectionChange = new EventEmitter<string[]>();
  @Output() exportRequested = new EventEmitter<string[]>();
  @Output() orderChange = new EventEmitter<string[]>();
  
  exportMode: boolean = false;
  selectedForExport: Set<string> = new Set();
  selectedElementsOrder: string[] = []; // Array para mantener el orden
  
  ngOnInit(): void {
    // Initialize component
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Sincronizar selección externa
    if (changes['externalSelectedIds'] || changes['externalSelectedOrder']) {
      this.syncExternalSelection();
    }
  }
  
  /**
   * Sincroniza la selección externa con el estado interno
   */
  private syncExternalSelection(): void {
    // Actualizar selección interna
    this.selectedForExport.clear();
    this.externalSelectedIds.forEach(id => this.selectedForExport.add(id));
    
    // Actualizar orden interno
    this.selectedElementsOrder = [...this.externalSelectedOrder];
  }
  
  /**
   * Toggles export mode on/off
   */
  toggleExportMode(): void {
    this.exportMode = !this.exportMode;
    if (!this.exportMode) {
      this.clearSelection();
    }
    this.exportModeChange.emit(this.exportMode);
  }
  
  /**
   * Toggles selection of an element
   * @param elementId ID of the element to toggle
   */
  toggleElementSelection(elementId: string): void {
    if (this.selectedForExport.has(elementId)) {
      this.selectedForExport.delete(elementId);
      // Remove from order array
      const index = this.selectedElementsOrder.indexOf(elementId);
      if (index > -1) {
        this.selectedElementsOrder.splice(index, 1);
      }
    } else {
      this.selectedForExport.add(elementId);
      // Add to order array
      this.selectedElementsOrder.push(elementId);
    }
    this.selectionChange.emit(this.getSelectedElementsInOrder());
    this.orderChange.emit([...this.selectedElementsOrder]);
  }
  
  /**
   * Checks if an element is selected
   * @param elementId ID of the element
   * @returns true if selected
   */
  isElementSelected(elementId: string): boolean {
    return this.selectedForExport.has(elementId);
  }
  
  /**
   * Gets the list of selected elements
   * @returns Array of selected element IDs
   */
  getSelectedElements(): string[] {
    return Array.from(this.selectedForExport);
  }
  
  /**
   * Gets the list of selected elements in order
   * @returns Array of selected element IDs in the correct order
   */
  getSelectedElementsInOrder(): string[] {
    return this.selectedElementsOrder.filter(id => this.selectedForExport.has(id));
  }
  
  /**
   * Clears all selections
   */
  clearSelection(): void {
    this.selectedForExport.clear();
    this.selectedElementsOrder = [];
    this.selectionChange.emit([]);
    this.orderChange.emit([]);
  }
  
  /**
   * Gets exportable item by ID
   * @param elementId ID of the element
   * @returns Exportable item or undefined
   */
  getExportableItem(elementId: string): ExportableItem | undefined {
    return this.exportableItems.find(item => item.id === elementId);
  }
  
  /**
   * TrackBy function for better performance and CDK identification
   * @param index Index of the element
   * @param elementId ID of the element
   * @returns Unique identifier
   */
  trackByElementId(index: number, elementId: string): string {
    return elementId;
  }
  
  /**
   * Requests export of selected elements
   */
  requestExport(): void {
    const selectedElements = this.getSelectedElementsInOrder();
    if (selectedElements.length > 0) {
      this.exportRequested.emit(selectedElements);
    }
  }
  
  /**
   * Handles drag and drop reordering of selected elements
   * @param event CDK drag drop event
   */
  onDrop(event: CdkDragDrop<string[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.selectedElementsOrder, event.previousIndex, event.currentIndex);
      this.orderChange.emit([...this.selectedElementsOrder]);
      this.selectionChange.emit(this.getSelectedElementsInOrder());
    }
  }
  
  /**
   * Selects all available elements
   */
  selectAll(): void {
    this.exportableItems.forEach(item => {
      if (!this.selectedForExport.has(item.id)) {
        this.selectedForExport.add(item.id);
        this.selectedElementsOrder.push(item.id);
      }
    });
    this.selectionChange.emit(this.getSelectedElementsInOrder());
    this.orderChange.emit([...this.selectedElementsOrder]);
  }
  
  /**
   * Gets the count of selected elements
   */
  get selectedCount(): number {
    return this.selectedForExport.size;
  }
  
  /**
   * Gets the count of total exportable elements
   */
  get totalCount(): number {
    return this.exportableItems.length;
  }
}
