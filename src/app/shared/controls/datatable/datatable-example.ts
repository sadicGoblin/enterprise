import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from './datatable.component';
import { DataTableColumn, DataTableConfig } from './datatable.models';

@Component({
  selector: 'app-datatable-example',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent
  ],
  template: `
    <div class="example-container">
      <h3>Ejemplo de DataTable</h3>
      <app-datatable 
        [data]="exampleData" 
        [columns]="tableColumns" 
        [config]="tableConfig"
        (rowClick)="onRowClick($event)"
        (sortChange)="onSortChange($event)">
      </app-datatable>
    </div>
  `,
  styles: [`
    .example-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    h3 {
      margin-bottom: 1rem;
      font-weight: 500;
    }
  `]
})
export class DataTableExampleComponent {
  // Datos de ejemplo similar a la imagen
  exampleData = [
    { id: 1, first: 'Noor', last: 'Cruz', email: 'noor.cruz@example.com', street: '55th Street and 5th Ave', city: 'New York', state: 'NY', country: 'United States', postal: '10022', active: false },
    { id: 2, first: 'Hana', last: 'Hill', email: 'hana.hill@example.com', street: '7 Rue de Rivoli', city: 'Paris', state: null, country: 'France', postal: '75004', active: true },
    { id: 3, first: 'Lennon', last: 'Williams', email: 'lennon.williams@example.com', street: 'Downing Street', city: 'London', state: null, country: 'United Kingdom', postal: 'SW1A 2AB', active: false },
    { id: 4, first: 'Arjun', last: 'Phillips', email: 'arjun.phillips@example.com', street: 'Herengracht 168', city: 'Amsterdam', state: null, country: 'Netherlands', postal: '1016 BP', active: false },
    { id: 5, first: 'Charlie', last: 'Ortiz', email: 'charlie.ortiz@example.com', street: 'Plaza Mayor', city: 'Madrid', state: null, country: 'Spain', postal: '28012', active: null },
    { id: 6, first: 'Kalani', last: 'Lee', email: 'kalani.lee@example.com', street: 'Acropolis', city: 'Athens', state: null, country: 'Greece', postal: '117 42', active: true },
    { id: 7, first: 'Linh', last: 'Wright', email: 'linh.wright@example.com', street: 'Yasukuni Shrine', city: 'Tokyo', state: null, country: 'Japan', postal: '102-8246', active: false },
    { id: 8, first: 'Carmen', last: 'Perez', email: 'carmen.perez@example.com', street: 'Ulitsa Arbat', city: 'Moscow', state: null, country: 'Russia', postal: '119002', active: false },
    { id: 9, first: 'Pranav', last: 'Lin', email: 'pranav.lin@example.com', street: 'Av. 9 de Julio', city: 'Buenos Aires', state: null, country: 'Argentina', postal: 'C1073ABA', active: false },
    { id: 10, first: 'Jiya', last: 'Jenkins', email: 'jiya.jenkins@example.com', street: 'Calle Florida', city: 'Buenos Aires', state: null, country: 'Argentina', postal: 'C1005AAM', active: false },
  ];

  // Definición de columnas
  tableColumns: DataTableColumn[] = [
    { field: 'id', header: 'ID', width: '50px', align: 'center', sortable: true },
    { field: 'first', header: 'First', sortable: true },
    { field: 'last', header: 'Last', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'street', header: 'Street', sortable: false },
    { field: 'city', header: 'City', sortable: true },
    { field: 'state', header: 'State', sortable: true },
    { field: 'country', header: 'Country', sortable: true },
    { field: 'postal', header: 'Postal', align: 'right', sortable: false },
    { 
      field: 'active', 
      header: 'Active', 
      align: 'center', 
      sortable: true,
      dataType: 'boolean',
      cellClass: 'status-cell'
    }
  ];

  // Configuración de la tabla
  tableConfig: DataTableConfig = {
    showRowNumber: true,
    selectable: true,
    pagination: true,
    pageSize: 10,
    maxHeight: '400px',
    shadow: false,
    noDataMessage: 'No hay registros disponibles',
    columnSelectLabel: 'Columnas'
  };

  onRowClick(row: any): void {
    console.log('Fila seleccionada:', row);
  }

  onSortChange(event: any): void {
    console.log('Cambio de ordenación:', event);
  }
}
