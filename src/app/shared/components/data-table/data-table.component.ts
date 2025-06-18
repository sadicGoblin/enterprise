import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent implements OnChanges {
  @Input() columns: { name: string; label: string; }[] = [];
  @Input() data: any[] = [];
  @Input() actionButtons: { icon: string; color: string; tooltip: string; action: string; }[] = [];
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() pageSize: number = 25;
  @Input() striped: boolean = true;
  
  @Output() rowAction = new EventEmitter<{action: string, item: any, index: number}>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data;
      
      // Apply paginator if available
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      
      // Apply sort if available
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }
    
    if (changes['columns']) {
      // Extract column names for the displayedColumns array
      this.displayedColumns = this.columns.map(col => col.name);
      
      // Add actions column if there are action buttons
      if (this.actionButtons && this.actionButtons.length > 0 && 
          !this.displayedColumns.includes('actions')) {
        this.displayedColumns.push('actions');
      }
    }
  }
  
  onAction(action: string, item: any, index: number): void {
    this.rowAction.emit({ action, item, index });
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Method to determine if a row should have a striped background
  isStripedRow(index: number): boolean {
    return this.striped && index % 2 !== 0;
  }
}
