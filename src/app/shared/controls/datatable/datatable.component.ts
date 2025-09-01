import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { DataTableColumn, DataTableConfig, DataTableFilter, FilterChangeEvent, FilterParams, RowSelectionEvent, SortEvent } from './datatable.models';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-datatable',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule,
    MatSelectModule,
    MatInputModule,
    MatListModule,
    FormsModule
  ],
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.scss']
})
export class DataTableComponent implements OnChanges, OnDestroy {
  @Input() data: any[] = [];
  @Input() columns: DataTableColumn[] = [];
  @Input() config: DataTableConfig = {
    showRowNumber: true,
    selectable: false,
    noDataMessage: 'Sin datos disponibles',
    maxHeight: '400px',
    pageSize: 15,
    pagination: true,
    shadow: false,
    columnSelectLabel: 'Columnas',
    showToolbar: true,
    clearAllFiltersLabel: 'Limpiar todos los filtros',
    exportExcelLabel: 'Exportar a Excel',
    exportFileName: 'Export_Data'
  };
  
  // Properties for column filtering (Excel-like filters)
  private activeColumnField: string | null = null;
  private columnFilters: Map<string, { options: any[], allOptions: any[], selectedOptions: any[] }> = new Map();
  private tempColumnFilters: Map<string, any[]> = new Map();

  @Output() rowClick = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<RowSelectionEvent>();
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() filterChange = new EventEmitter<FilterChangeEvent>();

  // Internal properties
  displayedColumns: string[] = [];
  displayData: any[] = [];
  filteredData: any[] = [];
  selectedRows: Set<number> = new Set();
  currentPage = 0;
  currentPageSize = 10;
  totalItems = 0;
  
  // Filter properties
  filterValues: FilterParams = {
    columnFilters: {},
    globalFilter: ''
  };
  globalFilterValue: string = '';
  
  // Column resize properties
  private isResizing = false;
  private resizingColumn: string | null = null;
  private startX = 0;
  private startWidth = 0;
  private columnElement: HTMLElement | null = null;
  private resizeListeners: (() => void)[] = [];
  
  // Flag to control client-side processing (default: true)
  private clientSideProcessing = true;

  /**
   * Handles component input changes
   * @param changes SimpleChanges object containing input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.setupTable();
    }
    
    if (changes['columns'] && !changes['columns'].firstChange) {
      this.setupColumns();
      this.applyFilters();
    }
    
    if (changes['config'] && !changes['config'].firstChange) {
      this.currentPageSize = this.config.pageSize || 10;
      this.setupTable();
    }
  }

  /**
   * Setup table initial state and data
   */
  private setupTable(): void {
    this.filteredData = [...this.data];
    this.totalItems = this.data.length;
    this.setupColumns();
    this.initializeColumnFilters();
    this.applyFilters();
    this.applyPaging();
  }

  /**
   * Setup column configuration
   */
  private setupColumns(): void {
    this.displayedColumns = [];
    
    // Add selection column if needed
    if (this.config.selectable) {
      this.displayedColumns.push('select');
    }
    
    // Add row number column if needed
    if (this.config.showRowNumber) {
      this.displayedColumns.push('rowNum');
    }
    
    // Add all data columns
    this.columns.forEach(column => {
      this.displayedColumns.push(column.field);
    });
  }

  /**
   * Initializes the column filters based on data and columns configuration
   */
  private initializeColumnFilters(): void {
    // For each filterable column, create a filter
    this.columns.forEach(column => {
      if (column.filterable !== false) {
        const uniqueValues = this.getUniqueValuesForField(column.field);
        
        if (uniqueValues.length > 0) {
          this.columnFilters.set(column.field, {
            options: uniqueValues,
            allOptions: uniqueValues,
            selectedOptions: [...uniqueValues] // Initially all selected
          });
        }
      }
    });
  }
  
  /**
   * Gets unique values for a specific field from the data
   * @param field Field to extract unique values from
   * @returns Array of unique string values
   */
  private getUniqueValuesForField(field: string): string[] {
    const values = new Set<string>();
    
    this.data.forEach(item => {
      const value = item[field];
      if (value !== null && value !== undefined) {
        values.add(String(value));
      }
    });
    
    return Array.from(values).sort();
  }

  /**
   * Gets property value from an object with support for nested properties
   * @param obj Object to extract value from
   * @param path Property path (e.g. 'user.name')
   * @returns Property value or null if not found
   */
  getPropertyValue(obj: any, path: string): any {
    // Handle nested properties (e.g. 'user.name')
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Gets unique values for a field in the data array
   */
  private getUniqueValues(field: string): string[] {
    if (!this.data || this.data.length === 0) {
      return [];
    }
    
    const values = new Set<string>();
    
    this.data.forEach(item => {
      const value = this.getPropertyValue(item, field);
      if (value !== null && value !== undefined) {
        values.add(String(value));
      }
    });
    
    return Array.from(values).sort();
  }

  /**
   * Applies all selected filters to the data
   */
  applyFilters(): void {
    let filteredData = [...this.data];
    
    // Apply Excel-like column filters if defined
    this.columnFilters.forEach((filterData, field) => {
      const { selectedOptions } = filterData;
      
      // Only filter if not all options are selected (partial selection)
      if (selectedOptions.length > 0 && selectedOptions.length < filterData.allOptions.length) {
        filteredData = filteredData.filter(item => {
          const value = item[field];
          return value === null || value === undefined || 
                 selectedOptions.includes(String(value));
        });
      } else if (selectedOptions.length === 0) {
        // If no options are selected, don't show any data for this column filter
        filteredData = filteredData.filter(item => {
          const value = item[field];
          return value === null || value === undefined;
        });
      }
    });
    
    // Apply global search filter if text is provided
    if (this.globalFilterValue?.trim()) {
      const searchTerm = this.globalFilterValue.trim().toLowerCase();
      filteredData = filteredData.filter(item => {
        return this.columns.some(column => {
          const value = item[column.field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }
    
    // Update the filtered data and reset pagination to first page
    this.filteredData = filteredData;
    this.totalItems = filteredData.length; // Update total items for paginator
    this.currentPage = 0; // Reset to first page
    this.applyPaging();
  }



  
  /**
   * Prepares filter data for a specific column when the filter icon is clicked
   * @param column Column definition to prepare filter for
   */
  prepareColumnFilter(column: DataTableColumn): void {
    this.activeColumnField = column.field;
    
    // If we don't have filter data for this column yet, create it
    if (!this.columnFilters.has(column.field)) {
      // Extract unique values for this column from data
      const uniqueValues = new Set<any>();
      this.data.forEach(row => {
        const value = row[column.field];
        if (value !== null && value !== undefined) {
          uniqueValues.add(String(value));
        }
      });
      
      const options = Array.from(uniqueValues).sort();
      this.columnFilters.set(column.field, {
        options: [...options],
        allOptions: [...options],
        selectedOptions: [...options] // Initially all options are selected
      });
      
      // Initialize temp filters for this session
      this.tempColumnFilters.set(column.field, [...options]);
    }
    
    // Make sure we set temp filters to the current selection state
    const currentFilter = this.columnFilters.get(column.field);
    if (currentFilter) {
      this.tempColumnFilters.set(column.field, [...currentFilter.selectedOptions]);
    }
  }
  
  /**
   * Filters options in the column filter dropdown based on search input
   * @param event Search input event
   * @param field Column field to filter
   */
  filterColumnOptions(event: Event, field: string): void {
    const searchText = (event.target as HTMLInputElement).value.toLowerCase();
    const filterData = this.columnFilters.get(field);
    
    if (!filterData) return;
    
    if (searchText) {
      // Filter options based on search text
      filterData.options = filterData.allOptions.filter(option => 
        String(option).toLowerCase().includes(searchText)
      );
    } else {
      // Reset to all options if search text is empty
      filterData.options = [...filterData.allOptions];
    }
    
    this.columnFilters.set(field, filterData);
  }
  
  /**
   * Gets the filtered list of options for a column filter dropdown
   * @param field Column field to get options for
   * @returns Array of filter options
   */
  getFilterOptionsForColumn(field: string): any[] {
    const filterData = this.columnFilters.get(field);
    return filterData ? filterData.options : [];
  }
  
  /**
   * Checks if a specific option is selected in the column filter
   * @param field Column field
   * @param option Option value to check
   * @returns True if the option is selected
   */
  isColumnFilterSelected(field: string, option: any): boolean {
    const selectedOptions = this.tempColumnFilters.get(field) || [];
    return selectedOptions.includes(option);
  }
  
  /**
   * Toggles selection state for a filter option and applies it immediately
   * @param field Column field
   * @param option Option value to toggle
   */
  toggleColumnFilterOption(field: string, option: any): void {
    const selectedOptions = this.tempColumnFilters.get(field) || [];
    
    if (selectedOptions.includes(option)) {
      // Remove option if already selected
      const index = selectedOptions.indexOf(option);
      selectedOptions.splice(index, 1);
    } else {
      // Add option if not selected
      selectedOptions.push(option);
    }
    
    this.tempColumnFilters.set(field, selectedOptions);
    
    // Apply filter immediately without needing to press Apply button
    this.applyColumnFilter(field);
  }
  
  /**
   * Selects all visible options in the filter dropdown
   * @param field Column field
   */
  selectAllColumnFilter(field: string): void {
    const filterData = this.columnFilters.get(field);
    if (!filterData) return;
    
    // Copy all options from the filter
    const allOptions = [...filterData.options];
    this.tempColumnFilters.set(field, allOptions);
    
    // Apply filter immediately without needing to press Apply button
    this.applyColumnFilter(field);
  }
  
  /**
   * Clears all selected options in the filter dropdown
   * @param field Column field
   */
  clearColumnFilter(field: string): void {
    this.tempColumnFilters.set(field, []);
    
    // Apply filter immediately without needing to press Apply button
    this.applyColumnFilter(field);
  }
  
  /**
   * Applies the column filter and updates the table data
   * @param field Column field to apply filter for
   */
  applyColumnFilter(field: string): void {
    const selectedOptions = this.tempColumnFilters.get(field) || [];
    const filterData = this.columnFilters.get(field);
    
    if (filterData) {
      // Update the selected options in our main filter state
      filterData.selectedOptions = [...selectedOptions];
      this.columnFilters.set(field, filterData);
      
      // Apply filters to data
      this.applyFilters();
    }
    
    // Close the filter menu
    this.activeColumnField = null;
  }
  
  /**
   * Closes the column filter dropdown without applying changes
   */
  closeColumnFilter(): void {
    // Reset temp filters to current selection state
    if (this.activeColumnField) {
      const currentFilter = this.columnFilters.get(this.activeColumnField);
      if (currentFilter) {
        this.tempColumnFilters.set(this.activeColumnField, [...currentFilter.selectedOptions]);
      }
    }
    
    // Close filter
    this.activeColumnField = null;
  }

  /**
   * Check if there are any active column filters
   * @returns True if any column has active filters
   */
  hasActiveFilters(): boolean {
    // Check if any column filter has partial selection (not all options selected)
    for (const [field, filterData] of this.columnFilters.entries()) {
      if (filterData.selectedOptions.length > 0 && 
          filterData.selectedOptions.length < filterData.allOptions.length) {
        return true;
      }
      if (filterData.selectedOptions.length === 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get appropriate icon for a field
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
   * Adjusts the dimensions and position of the options panel when opened
   * @param select The mat-select component
   * @param isOpen Whether the panel is open
   */
  adjustPanelHeight(select: MatSelect, isOpen: boolean): void {
    if (isOpen) {
      // Small timeout to wait for the panel to initially render
      setTimeout(() => {
        // Select the current options panel
        const panel = document.querySelector('.cdk-overlay-pane:not(.cdk-visually-hidden) .mat-mdc-select-panel') as HTMLElement;
        if (panel) {
          // Configure transitions before modifying properties (step 1)
          panel.style.transition = 'min-width 0.25s ease-out, width 0.25s ease-out';
          
          // Apply specific styles for options (text and formatting)
          const options = panel.querySelectorAll('.mat-mdc-option .mdc-list-item__primary-text') as NodeListOf<HTMLElement>;
          options.forEach(option => {
            option.style.whiteSpace = 'nowrap';
            option.style.overflow = 'hidden';
            option.style.textOverflow = 'ellipsis';
            option.style.display = 'block';
          });
          
          // Add prevention of selection events as a precaution
          panel.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
          });
          
          // Also ensure checkboxes don't allow text selection
          const checkboxes = panel.querySelectorAll('.mat-pseudo-checkbox') as NodeListOf<HTMLElement>;
          checkboxes.forEach(checkbox => {
            checkbox.style.userSelect = 'none';
          });
          
          // Select the overlay container
          const overlayPane = document.querySelector('.cdk-overlay-pane:not(.cdk-visually-hidden)') as HTMLElement;
          if (overlayPane) {
            // Configure transitions before modifying properties (step 1)
            overlayPane.style.transition = 'transform 0.25s ease-out, min-width 0.25s ease-out';
            
            // Small delay to apply transitions after (step 2)
            setTimeout(() => {
              // Modify dimensions
              panel.style.minWidth = '250px';
              overlayPane.style.minWidth = '250px';
              
              // Adjust position to the left
              // First get the current transformation
              const currentTransform = window.getComputedStyle(overlayPane).transform;
              
              // If it already has a transformation, modify it
              if (currentTransform && currentTransform !== 'none') {
                // Extract the transformation matrix
                const matrix = new DOMMatrix(currentTransform);
                // Move 50px to the left
                matrix.e -= 50; // X offset
                overlayPane.style.transform = matrix.toString();
              } else {
                // If no transformation, add one to move 50px to the left
                overlayPane.style.transform = 'translateX(-50px)';
              }
              
              // Ensure it doesn't go off-screen
              const rect = overlayPane.getBoundingClientRect();
              if (rect.left < 0) {
                overlayPane.style.transform = 'translateX(0)';
              }
            }, 50); // Small delay to apply changes after setting the transition
          }
          
          // Apply specific styles for the panel
          panel.style.overflowY = 'auto';
          panel.style.overflowX = 'hidden';
          panel.style.maxHeight = '300px';
        }
      }, 50);
    }
  }



  applyPaging(): void {
    if (!this.config.pagination) {
      this.displayData = [...this.filteredData];
      return;
    }
    
    const start = this.currentPage * this.currentPageSize;
    const end = start + this.currentPageSize;
    this.displayData = this.filteredData.slice(start, end);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
    this.applyPaging();
    this.pageChange.emit({
      pageIndex: this.currentPage,
      pageSize: this.currentPageSize,
      length: this.totalItems
    });
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit({
      field: sort.active,
      order: sort.direction as 'asc' | 'desc'
    });
    
    // If client-side processing is enabled
    if (this.clientSideProcessing) {
      // Reset to first page on sort
      this.currentPage = 0;
      
      if (!sort.active || sort.direction === '') {
        // No active sorting, use original data order
        this.applyFilters();
        return;
      }
      
      this.filteredData = [...this.filteredData].sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        const valueA = this.getPropertyValue(a, sort.active);
        const valueB = this.getPropertyValue(b, sort.active);
        
        if (valueA === null || valueA === undefined) return isAsc ? -1 : 1;
        if (valueB === null || valueB === undefined) return isAsc ? 1 : -1;
        
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return isAsc ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
        
        return isAsc ? valueA - valueB : valueB - valueA;
      });
    }
  }
  
  /**
   * Column resize functionality
   */
  startColumnResize(event: MouseEvent, columnField: string): void {
    // Prevent text selection during resize
    event.preventDefault();
    
    this.isResizing = true;
    this.resizingColumn = columnField;
    this.startX = event.pageX;
    
    // Find the header cell for this column
    const headerRow = (event.target as HTMLElement).closest('tr');
    if (headerRow) {
      // Find the specific th element for this column
      const headerCells = Array.from(headerRow.querySelectorAll('th'));
      this.columnElement = headerCells.find(cell => {
        return cell.getAttribute('data-column-field') === columnField;
      }) || null;
      
      if (this.columnElement) {
        this.startWidth = this.columnElement.offsetWidth;
        
        // Add global event listeners for mouse move and mouse up
        const mouseMoveHandler = this.onMouseMove.bind(this);
        const mouseUpHandler = this.onMouseUp.bind(this);
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        
        // Store listeners for cleanup
        this.resizeListeners = [
          () => document.removeEventListener('mousemove', mouseMoveHandler),
          () => document.removeEventListener('mouseup', mouseUpHandler)
        ];
      }
    }
  }
  
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing || !this.columnElement || !this.resizingColumn) {
      return;
    }
    
    const diffX = event.pageX - this.startX;
    const newWidth = Math.max(100, this.startWidth + diffX); // Minimum width of 100px
    
    // Update the width of the header cell
    this.columnElement.style.width = `${newWidth}px`;
    this.columnElement.style.minWidth = `${newWidth}px`;
    this.columnElement.style.maxWidth = `${newWidth}px`;
    
    // Also update all data cells for this column to maintain alignment
    const table = this.columnElement.closest('table');
    if (table) {
      const columnIndex = Array.from(this.columnElement.parentElement?.children || []).indexOf(this.columnElement);
      const dataCells = table.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
      
      dataCells.forEach((cell) => {
        const element = cell as HTMLElement;
        element.style.width = `${newWidth}px`;
        element.style.minWidth = `${newWidth}px`;
        element.style.maxWidth = `${newWidth}px`;
      });
    }
  }
  
  onMouseUp(): void {
    this.isResizing = false;
    this.resizingColumn = null;
    this.columnElement = null;
    
    // Clean up event listeners
    this.resizeListeners.forEach(removeListener => removeListener());
    this.resizeListeners = [];
  }
  
  ngOnDestroy(): void {
    // Clean up any remaining event listeners
    this.resizeListeners.forEach(removeListener => removeListener());
    this.resizeListeners = [];
  }

  /**
   * Handle click on a row
   * @param row The row data that was clicked
   * @param index The row index
   */
  onRowClick(row: any, index: number): void {
    // Emit the row data
    this.rowClick.emit(row);
  }
  
  /**
   * Handle selection of a row
   * @param event Change event from checkbox
   * @param row Row data
   * @param index Index of the selected row
   */
  onRowSelect(event: any, row: any, index: number): void {
    const isSelected = this.selectedRows.has(index);
    
    if (isSelected) {
      this.selectedRows.delete(index);
    } else {
      this.selectedRows.add(index);
    }
    
    // Emit selection event according to RowSelectionEvent interface
    this.rowSelect.emit({
      row: row,
      index: index,
      selected: !isSelected // Toggle the previous state
    });
  }

  isSelected(index: number): boolean {
    return this.selectedRows.has(index);
  }


  /**
   * Format cell value based on column configuration
   * @param column Column definition
   * @param row Row data
   * @returns Formatted value for display
   */
  formatCellValue(column: DataTableColumn, row: any): any {
    const value = this.getPropertyValue(row, column.field);
    
    if (column.format) {
      return column.format(value, row);
    }
    
    // Handle specific data types
    if (column.dataType === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    
    // For null or undefined values
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    return value;
  }

  /**
   * Get CSS classes for a cell based on column configuration and value
   * @param column Column definition
   * @param value Cell value
   * @returns String of CSS classes
   */
  getCellClass(column: DataTableColumn, value: any): string {
    let classes = '';
    
    if (column.align) {
      classes += `text-${column.align} `;
    }
    
    if (column.cellClass) {
      classes += `${column.cellClass} `;
    }
    
    // Add classes based on data type or value
    if (column.dataType === 'boolean') {
      if (value === true || value === 'TRUE') {
        classes += 'cell-true ';
      } else if (value === false || value === 'FALSE') {
        classes += 'cell-false ';
      }
    }
    
    if (value === null || value === undefined || value === 'NULL') {
      classes += 'cell-null ';
    }
    
    return classes.trim();
  }

  /**
   * Exports all data to Excel (original data, not filtered)
   */
  exportToExcel(): void {
    if (!this.data || this.data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.config.exportFileName || 'Data');

    // Define columns based on column configuration
    const columns = this.columns.map(column => {
      return { header: column.header, key: column.field, width: 20 };
    });

    worksheet.columns = columns;

    // Style for header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2C2C41' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add all data to Excel (not filtered data)
    this.data.forEach(item => {
      const row: Record<string, any> = {};
      this.columns.forEach(column => {
        row[column.field] = this.getPropertyValue(item, column.field);
      });
      worksheet.addRow(row);
    });

    // Auto-adjust column width
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column['eachCell']?.({ includeEmpty: true }, (cell: any) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10;
        if (columnWidth > maxLength) {
          maxLength = columnWidth;
        }
      });
      column.width = Math.min(maxLength + 2, 30); // Limit to max of 30
    });

    // Generate file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const date = new Date().toISOString().split('T')[0];
      const fileName = this.config.exportFileName || 'Data';
      saveAs(blob, `${fileName}_${date}.xlsx`);
    });
  }

  /**
   * Clears all filters at once
   */
  clearAllFilters(): void {
    this.globalFilterValue = '';
    this.columnFilters.forEach((filterData, field) => {
      filterData.selectedOptions = [...filterData.allOptions];
    });
    this.filterValues = {
      columnFilters: {},
      globalFilter: ''
    };
    this.applyFilters();
  }
}
