import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccidenteService, ListarTrabajadoresResponseItem } from '../../../services/accidente.service';

@Component({
  selector: 'app-accident-workers-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './accident-workers-list.component.html',
  styleUrl: './accident-workers-list.component.scss'
})
export class AccidentWorkersListComponent implements OnInit {
  private _paginator: MatPaginator | null = null;
  private _sort: MatSort | null = null;

  @ViewChild(MatPaginator)
  set paginator(p: MatPaginator) {
    this._paginator = p;
    this.dataSource.paginator = p;
  }

  @ViewChild(MatSort)
  set sort(s: MatSort) {
    this._sort = s;
    this.dataSource.sort = s;
  }

  isLoading = true;
  q = '';
  includeInactive = false;

  displayedColumns: string[] = ['Nombre', 'RUT', 'Email', 'Telefono', 'is_active', 'actions'];
  dataSource = new MatTableDataSource<ListarTrabajadoresResponseItem>([]);

  constructor(
    private accidenteService: AccidenteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.accidenteService.listarTrabajadores({
      q: this.q || undefined,
      include_inactive: this.includeInactive,
      // Se trae un set razonable y se pagina en frontend
      limit: 2000,
      offset: 0
    }).subscribe({
      next: (resp) => {
        const rows = (resp && (resp as any).success && Array.isArray((resp as any).data)) ? (resp as any).data : [];
        this.dataSource.data = rows;
        this._paginator?.firstPage();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[WorkersList] Error:', err);
        this.isLoading = false;
        this.dataSource.data = [];
      }
    });
  }

  onSearchChange(): void {
    // Debounce simple: el listado es chico; recargar manualmente con Enter o botón.
  }

  toggleIncludeInactive(): void {
    this.includeInactive = !this.includeInactive;
    this.load();
  }

  createNew(): void {
    this.router.navigate(['/check-list/accidents/workers/new']);
  }

  edit(row: ListarTrabajadoresResponseItem): void {
    const id = parseInt(String(row.IdTrabajador), 10);
    if (!isNaN(id)) {
      this.router.navigate(['/check-list/accidents/workers/edit', id]);
    }
  }

  isActiveLabel(v: any): string {
    const n = typeof v === 'string' ? parseInt(v, 10) : v;
    return n === 1 ? 'Activo' : 'Inactivo';
  }
}

