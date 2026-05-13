import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccidenteService, ListarTrabajadoresResponseItem } from '../../../services/accidente.service';
import { BtnComponent, KpiTileComponent, PillComponent, PillVariant } from '../../../../../shared/ui';

@Component({
  selector: 'app-accident-workers-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    BtnComponent,
    PillComponent,
    KpiTileComponent
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

  displayedColumns: string[] = ['avatar', 'Nombre', 'RUT', 'Email', 'Telefono', 'is_active', 'actions'];
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
    // Debounce simple: recargar con Enter o botón.
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

  // ---------------------------------------------------------------------------
  // DS §5.7 — Avatar, KPIs, helpers
  // ---------------------------------------------------------------------------
  initials(nombre: string | null | undefined): string {
    if (!nombre) return '—';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  isActive(row: ListarTrabajadoresResponseItem): boolean {
    const v = (row as any).is_active;
    const n = typeof v === 'string' ? parseInt(v, 10) : v;
    return n === 1;
  }

  isActiveVariant(row: ListarTrabajadoresResponseItem): PillVariant {
    return this.isActive(row) ? 'success' : 'neutral';
  }

  isActiveLabel(v: any): string {
    const n = typeof v === 'string' ? parseInt(v, 10) : v;
    return n === 1 ? 'Activo' : 'Inactivo';
  }

  edad(fechaNacimiento: string | null | undefined): number | null {
    if (!fechaNacimiento) return null;
    const d = new Date(fechaNacimiento.includes('T') ? fechaNacimiento : fechaNacimiento + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age >= 0 && age < 120 ? age : null;
  }

  get kpiTotal(): number {
    return this.dataSource.data.length;
  }

  get kpiActivos(): number {
    return this.dataSource.data.filter(r => this.isActive(r)).length;
  }

  get kpiInactivos(): number {
    return this.dataSource.data.filter(r => !this.isActive(r)).length;
  }

  get kpiEdadPromedio(): number {
    const ages = this.dataSource.data
      .map(r => this.edad((r as any).FechaNacimiento))
      .filter((a): a is number => a !== null);
    if (ages.length === 0) return 0;
    return Math.round(ages.reduce((s, a) => s + a, 0) / ages.length);
  }

  hasActiveFilters(): boolean {
    return !!this.q || this.includeInactive;
  }

  clearFilters(): void {
    this.q = '';
    this.includeInactive = false;
    this.load();
  }
}
