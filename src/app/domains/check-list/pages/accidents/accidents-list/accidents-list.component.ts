import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  AccidenteApiResponse,
  CalificacionPotencialSeveridad,
  EstadoAccidente,
  ESTADO_LABELS
} from '../models/accident.model';
import { AccidenteService } from '../../../services/accidente.service';
import { ExportService, ExportColumn } from '../../../../../shared/services/export.service';
import { AccidentDetailDialogComponent } from '../accident-detail-dialog/accident-detail-dialog.component';

@Component({
  selector: 'app-accidents-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './accidents-list.component.html',
  styleUrl: './accidents-list.component.scss'
})
export class AccidentsListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = [
    'NombreObra',
    'FechaAccidente',
    'NombreTrabajador',
    'NombreEmpresa',
    'TipoAccidente',
    'CalificacionPS',
    'DiasPerdidos',
    'Estado',
    'actions'
  ];

  dataSource = new MatTableDataSource<AccidenteApiResponse>([]);
  accidents: AccidenteApiResponse[] = [];
  isLoading = true;
  estadoLabels = ESTADO_LABELS;

  // Filtros
  filterEstado: string = 'all';
  filterGravedad: string = 'all';
  filterObra: string = 'all';
  searchText: string = '';

  // Opciones únicas para filtros
  obrasUnicas: string[] = [];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private accidenteService: AccidenteService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.setupSorting();
  }

  loadData(): void {
    this.isLoading = true;
    this.accidenteService.listarAccidentes({ limit: 500 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.accidents = response.data;
          this.dataSource.data = this.accidents;
          this.obrasUnicas = [...new Set(this.accidents.map(a => a.NombreObra))];
          this.setupFilter();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[AccidentsListComponent] Error loading accidents:', err);
        this.isLoading = false;
      }
    });
  }

  setupSorting(): void {
    this.dataSource.sortingDataAccessor = (item: AccidenteApiResponse, property: string) => {
      switch (property) {
        case 'FechaAccidente': return item.FechaAccidente ? new Date(item.FechaAccidente).getTime() : 0;
        case 'NombreTrabajador': return (item.NombreTrabajador || '').toLowerCase();
        case 'DiasPerdidos': return parseInt(item.DiasPerdidosFinal || item.DiasPerdidosEstimados || '0', 10);
        default: return (item as any)[property] || '';
      }
    };
  }

  setupFilter(): void {
    this.dataSource.filterPredicate = (data: AccidenteApiResponse, filter: string) => {
      const filters = JSON.parse(filter);

      if (filters.estado !== 'all' && data.Estado !== filters.estado) return false;
      if (filters.gravedad !== 'all' && data.CalificacionPS !== filters.gravedad) return false;
      if (filters.obra !== 'all' && data.NombreObra !== filters.obra) return false;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          (data.NombreObra || '').toLowerCase().includes(searchLower) ||
          (data.NombreTrabajador || '').toLowerCase().includes(searchLower) ||
          (data.NombreEmpresa || '').toLowerCase().includes(searchLower) ||
          (data.Descripcion || '').toLowerCase().includes(searchLower)
        );
      }
      return true;
    };
  }

  applyFilters(): void {
    const filterValue = JSON.stringify({
      estado: this.filterEstado,
      gravedad: this.filterGravedad,
      obra: this.filterObra,
      search: this.searchText
    });
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getGravedadClass(gravedad: string | null): string {
    if (!gravedad) return '';
    const classes: Record<string, string> = {
      'Leve': 'severity-leve',
      'Menor': 'severity-menor',
      'Importante': 'severity-importante',
      'Grave': 'severity-grave',
      'Fatal': 'severity-fatal'
    };
    return classes[gravedad] || '';
  }

  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'Reportado': 'estado-reportado',
      'En_Investigacion': 'estado-investigacion',
      'Cerrado': 'estado-cerrado',
      'Anulado': 'estado-anulado'
    };
    return classes[estado] || '';
  }

  getEstadoLabel(estado: string): string {
    return (this.estadoLabels as any)[estado] || estado;
  }

  viewDetails(accident: AccidenteApiResponse): void {
    this.dialog.open(AccidentDetailDialogComponent, {
      data: accident,
      width: '800px',
      maxHeight: '90vh',
      panelClass: 'accident-detail-panel'
    });
  }

  editAccident(accident: AccidenteApiResponse): void {
    this.router.navigate(['/check-list/accidents/edit', accident.IdAccidente]);
  }

  createNewAccident(): void {
    this.router.navigate(['/check-list/accidents/register']);
  }

  viewStatistics(): void {
    this.router.navigate(['/check-list/accidents/statistics']);
  }

  exportToExcel(): void {
    const data = this.dataSource.filteredData;
    if (data.length === 0) return;

    const columns: ExportColumn[] = [
      { field: 'NombreObra', header: 'Obra', width: 25 },
      { field: 'FechaAccidente', header: 'Fecha Accidente', width: 15, format: (v) => this.formatDate(v) },
      { field: 'NombreTrabajador', header: 'Trabajador', width: 30 },
      { field: 'RUTTrabajador', header: 'RUT', width: 15 },
      { field: 'NombreEmpresa', header: 'Empresa', width: 20 },
      { field: 'TipoAccidente', header: 'Tipo', width: 12 },
      { field: 'CalificacionPS', header: 'Gravedad', width: 15 },
      { field: 'DiasPerdidosEstimados', header: 'Días Est.', width: 10 },
      { field: 'DiasPerdidosFinal', header: 'Días Final', width: 10 },
      { field: 'Estado', header: 'Estado', width: 15 },
      { field: 'Descripcion', header: 'Descripción', width: 50 }
    ];

    this.exportService.exportToExcel(data, columns, {
      fileName: 'Listado_Accidentes',
      sheetName: 'Accidentes'
    });
  }

  formatDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00');
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CL');
  }

  get totalDiasPerdidos(): number {
    return this.accidents.reduce((sum, a) => {
      return sum + parseInt(a.DiasPerdidosFinal || a.DiasPerdidosEstimados || '0', 10);
    }, 0);
  }

  get investigacionCount(): number {
    return this.accidents.filter(a => a.Estado === 'En_Investigacion').length;
  }

  get gravedadAltaCount(): number {
    return this.accidents.filter(a =>
      a.CalificacionPS === 'Grave' || a.CalificacionPS === 'Fatal'
    ).length;
  }
}
