import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { DataTableColumn, DataTableConfig, RowSelectionEvent, SortEvent } from './datatable.models';

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
    MatButtonModule
  ],
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.scss']
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: DataTableColumn[] = [];
  @Input() config: DataTableConfig = {
    showRowNumber: true,
    selectable: false,
    noDataMessage: 'Sin datos disponibles',
    maxHeight: '400px',
    pageSize: 10,
    pagination: true,
    shadow: false,
    columnSelectLabel: 'Columnas'
  };

  @Output() rowClick = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<RowSelectionEvent>();
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  // Propiedades internas
  displayedColumns: string[] = [];
  displayData: any[] = [];
  selectedRows: Set<number> = new Set();
  currentPage = 0;
  currentPageSize = 10;
  totalItems = 0;
  
  // Columnas disponibles y seleccionadas para control de visibilidad
  availableColumns: DataTableColumn[] = [];
  visibleColumns: Set<string> = new Set();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['columns']) {
      this.setupTable();
    }
    
    if (changes['config'] && !changes['config'].firstChange) {
      this.currentPageSize = this.config.pageSize || 10;
      this.setupTable();
    }
  }

  private setupTable(): void {
    this.displayData = [...this.data];
    this.totalItems = this.data.length;
    this.setupColumns();
    this.applyPaging();
  }

  private setupColumns(): void {
    this.availableColumns = [...this.columns];
    this.displayedColumns = [];
    
    // Añadir columna de selección si es necesario
    if (this.config.selectable) {
      this.displayedColumns.push('select');
    }
    
    // Añadir columna de números de fila si es necesario
    if (this.config.showRowNumber) {
      this.displayedColumns.push('rowNum');
    }
    
    // Inicializar columnas visibles
    this.visibleColumns = new Set(this.columns.map(col => col.field));
    
    // Añadir columnas de datos
    this.columns.forEach(column => {
      if (this.visibleColumns.has(column.field)) {
        this.displayedColumns.push(column.field);
      }
    });
  }

  toggleColumnVisibility(field: string): void {
    if (this.visibleColumns.has(field)) {
      this.visibleColumns.delete(field);
    } else {
      this.visibleColumns.add(field);
    }
    this.setupColumns();
  }

  applyPaging(): void {
    if (!this.config.pagination) {
      this.displayData = [...this.data];
      return;
    }
    
    const start = this.currentPage * this.currentPageSize;
    const end = start + this.currentPageSize;
    this.displayData = this.data.slice(start, end);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.currentPageSize = event.pageSize;
    this.applyPaging();
    this.pageChange.emit({
      page: this.currentPage,
      pageSize: this.currentPageSize
    });
  }

  onSortChange(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.displayData = [...this.data];
      return;
    }

    this.sortChange.emit({
      field: sort.active,
      order: sort.direction as 'asc' | 'desc'
    });

    // Realizar ordenación local si no se maneja externamente
    this.displayData = this.displayData.sort((a, b) => {
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

  onRowClick(row: any, index: number): void {
    this.rowClick.emit(row);
  }

  onRowSelect(event: any, row: any, index: number): void {
    const selected = event.checked;
    
    if (selected) {
      this.selectedRows.add(index);
    } else {
      this.selectedRows.delete(index);
    }
    
    this.rowSelect.emit({
      row,
      index,
      selected
    });
  }

  isSelected(index: number): boolean {
    return this.selectedRows.has(index);
  }

  formatCellValue(column: DataTableColumn, row: any): any {
    const value = this.getPropertyValue(row, column.field);
    
    if (column.format) {
      return column.format(value, row);
    }
    
    // Manejo de tipos de datos específicos
    if (column.dataType === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    
    // Para valores nulos o indefinidos
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    return value;
  }

  getCellClass(column: DataTableColumn, value: any): string {
    let classes = '';
    
    if (column.align) {
      classes += `text-${column.align} `;
    }
    
    if (column.cellClass) {
      classes += `${column.cellClass} `;
    }
    
    // Añadir clases según el tipo de dato o valor
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

  private getPropertyValue(obj: any, path: string): any {
    // Manejar propiedades anidadas (ej: 'user.name')
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
}
