import { Component, OnInit, Input, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InspeccionSSTMA } from '../../models/actividad.models';

interface InspectionItem {
  id?: number;
  condicionRiesgo: string;
  incidencia: string;
  potencialRiesgo: string;
  clasificacionHallazgo: string;
  medidaCorrectiva: string;
  responsable: string;
  fechaCompromiso: Date | string;
  fechaCompromisoFormateada?: string;
  fechaCierre: Date | string;
  fechaCierreFormateada?: string;
}

@Component({
  selector: 'app-inspection-table',
  templateUrl: './inspection-table.component.html',
  styleUrls: ['./inspection-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class InspectionTableComponent implements OnInit, AfterViewInit {
  @Input() inspectionData: InspeccionSSTMA | null = null;

  // Tabla de inspecciones
  inspectionItems: InspectionItem[] = [];
  dataSource = new MatTableDataSource<InspectionItem>([]);
  displayedColumns: string[] = [
    'condicionRiesgo',
    'incidencia',
    'potencialRiesgo',
    'clasificacionHallazgo',
    'medidaCorrectiva',
    'responsable',
    'fechaCompromiso',
    'fechaCierre'
  ];

  // Propiedades para la UI
  isLoading = false;
  errorMessage: string | null = null;
  filterValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {}

  ngOnInit(): void {
    this.loadInspectionData();
  }

  ngAfterViewInit(): void {
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  /**
   * Carga los datos de inspección
   */
  loadInspectionData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.inspectionData) {
      try {
        // Aquí deberíamos transformar los datos recibidos en items de inspección
        // Este es un ejemplo, necesitamos ajustarlo según los datos reales que recibamos
        this.processInspectionData();
        this.dataSource = new MatTableDataSource<InspectionItem>(this.inspectionItems);
        
        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
        });
      } catch (error) {
        console.error('Error processing inspection data:', error);
        this.errorMessage = 'Error al procesar los datos de inspección';
      }
    } else {
      this.errorMessage = 'No hay datos de inspección disponibles';
    }
    
    this.isLoading = false;
  }

  /**
   * Procesa los datos de inspección para mostrarlos en la tabla
   */
  private processInspectionData(): void {
    // Implementación de ejemplo - debe adaptarse a la estructura real de datos
    if (this.inspectionData) {
      // Asumimos que los datos tienen una estructura específica
      // Esto debe adaptarse al formato real de los datos que recibe
      
      // Ejemplo de datos de prueba:
      this.inspectionItems = [
        {
          condicionRiesgo: 'Condición de prueba',
          incidencia: 'Seguridad',
          potencialRiesgo: 'Medianamente grave',
          clasificacionHallazgo: 'Observación',
          medidaCorrectiva: 'Revisar protocolo',
          responsable: 'Responsable de prueba',
          fechaCompromiso: new Date(),
          fechaCompromisoFormateada: this.formatDate(new Date()),
          fechaCierre: new Date(),
          fechaCierreFormateada: this.formatDate(new Date())
        }
      ];
      
      // TODO: Reemplazar con datos reales cuando esté integrado
    }
  }

  /**
   * Formatea una fecha al formato DD-MM-YYYY
   * @param date Fecha a formatear
   * @returns Fecha formateada como string
   */
  private formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
  }

  /**
   * Filtra los datos de la tabla según el término de búsqueda
   * @param event Evento del input de búsqueda
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValue = filterValue.trim().toLowerCase();
    this.dataSource.filter = this.filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
