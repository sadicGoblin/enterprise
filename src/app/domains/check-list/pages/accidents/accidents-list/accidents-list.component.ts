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
import { Router } from '@angular/router';
import { 
  AccidentRecord, 
  MOCK_ACCIDENTS, 
  MOCK_ESTADISTICAS,
  CalificacionPotencialSeveridad,
  EstadoAccidente
} from '../models/accident.model';
import { ExportService, ExportColumn } from '../../../../../shared/services/export.service';

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
    MatPaginatorModule
  ],
  templateUrl: './accidents-list.component.html',
  styleUrl: './accidents-list.component.scss'
})
export class AccidentsListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = [
    'obra',
    'fechaAccidente',
    'trabajador',
    'empresa',
    'tipoAccidente',
    'calificacionPS',
    'diasPerdidos',
    'estado',
    'actions'
  ];

  dataSource = new MatTableDataSource<AccidentRecord>([]);
  accidents: AccidentRecord[] = [];
  estadisticas = MOCK_ESTADISTICAS;

  // Filtros
  filterEstado: string = 'all';
  filterGravedad: string = 'all';
  filterObra: string = 'all';
  searchText: string = '';

  // Opciones únicas para filtros
  obrasUnicas: string[] = [];

  constructor(
    private router: Router,
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
    this.accidents = MOCK_ACCIDENTS;
    this.dataSource.data = this.accidents;
    this.obrasUnicas = [...new Set(this.accidents.map(a => a.obra))];
    this.setupFilter();
  }

  setupSorting(): void {
    this.dataSource.sortingDataAccessor = (item: AccidentRecord, property: string) => {
      switch (property) {
        case 'fechaAccidente': return new Date(item.fechaAccidente).getTime();
        case 'trabajador': return item.trabajador.nombre.toLowerCase();
        case 'diasPerdidos': return item.diasPerdidosFinal || item.diasPerdidosEstimados || 0;
        default: return (item as any)[property];
      }
    };
  }

  setupFilter(): void {
    this.dataSource.filterPredicate = (data: AccidentRecord, filter: string) => {
      const filters = JSON.parse(filter);
      
      if (filters.estado !== 'all' && data.estado !== filters.estado) return false;
      if (filters.gravedad !== 'all' && data.analisis.calificacionPS !== filters.gravedad) return false;
      if (filters.obra !== 'all' && data.obra !== filters.obra) return false;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          data.obra.toLowerCase().includes(searchLower) ||
          data.trabajador.nombre.toLowerCase().includes(searchLower) ||
          data.empresa.toLowerCase().includes(searchLower) ||
          data.descripcion.toLowerCase().includes(searchLower)
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

  getGravedadClass(gravedad: CalificacionPotencialSeveridad): string {
    const classes: Record<string, string> = {
      'Leve': 'severity-leve',
      'Menor': 'severity-menor',
      'Importante': 'severity-importante',
      'Grave': 'severity-grave',
      'Fatal': 'severity-fatal'
    };
    return classes[gravedad] || '';
  }

  getEstadoClass(estado: EstadoAccidente): string {
    const classes: Record<string, string> = {
      'Reportado': 'estado-reportado',
      'En Investigación': 'estado-investigacion',
      'Cerrado': 'estado-cerrado',
      'Pendiente': 'estado-pendiente'
    };
    return classes[estado] || '';
  }

  viewDetails(accident: AccidentRecord): void {
    console.log('View details:', accident);
  }

  editAccident(accident: AccidentRecord): void {
    console.log('Edit accident:', accident);
  }

  createNewAccident(): void {
    this.router.navigate(['/check-list/accidents']);
  }

  viewStatistics(): void {
    this.router.navigate(['/check-list/accidents/statistics']);
  }

  exportToExcel(): void {
    const data = this.dataSource.filteredData;
    if (data.length === 0) return;

    const columns: ExportColumn[] = [
      { field: 'obra', header: 'Obra', width: 25 },
      { field: 'fechaAccidente', header: 'Fecha Accidente', width: 15, format: (v) => this.formatDate(v) },
      { field: 'trabajador.nombre', header: 'Trabajador', width: 30 },
      { field: 'trabajador.rut', header: 'RUT', width: 15 },
      { field: 'empresa', header: 'Empresa', width: 20 },
      { field: 'tipoAccidente', header: 'Tipo', width: 12 },
      { field: 'analisis.calificacionPS', header: 'Gravedad', width: 15 },
      { field: 'diasPerdidosEstimados', header: 'Días Est.', width: 10 },
      { field: 'diasPerdidosFinal', header: 'Días Final', width: 10 },
      { field: 'estado', header: 'Estado', width: 15 },
      { field: 'descripcion', header: 'Descripción', width: 50 }
    ];

    this.exportService.exportToExcel(data, columns, {
      fileName: 'Listado_Accidentes',
      sheetName: 'Accidentes'
    });
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-CL');
  }

  get totalDiasPerdidos(): number {
    return this.accidents.reduce((sum, a) => sum + (a.diasPerdidosFinal || a.diasPerdidosEstimados || 0), 0);
  }

  get investigacionCount(): number {
    return this.accidents.filter(a => a.estado === 'En Investigación').length;
  }

  get gravedadAltaCount(): number {
    return this.accidents.filter(a => 
      a.analisis.calificacionPS === 'Grave' || a.analisis.calificacionPS === 'Fatal'
    ).length;
  }
}
