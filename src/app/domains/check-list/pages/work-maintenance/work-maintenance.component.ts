import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ObraService } from '../../services/obra.service';
import { Obra } from '../../models/obra.models';

interface Work {
  id: string;
  code: string;
  name: string;
  address?: string;
  commune: string;
  communeId?: string;
  startDate: string;
  endDate: string;
  observations?: string;
}

@Component({
  selector: 'app-work-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './work-maintenance.component.html',
  styleUrl: './work-maintenance.component.scss',
})
export class WorkMaintenanceComponent implements OnInit {
  workForm = {
    id: '',
    code: '',
    name: '',
    address: '',
    startDate: '',
    endDate: '',
    communeId: '',
    commune: '',
    observations: '',
  };

  // Will be populated dynamically from API response
  communes: { id: string, name: string }[] = [];

  works: Work[] = [];
  dataSource = new MatTableDataSource<Work>(this.works);

  isEditing = false;
  editingIndex: number | null = null;
  isLoading = false;
  displayedColumns = ['code', 'name', 'commune', 'startDate', 'endDate', 'actions'];

  constructor(
    private obraService: ObraService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchWorks();
  }

  fetchWorks(): void {
    this.isLoading = true;
    this.obraService.getObras().subscribe({
      next: (response) => {
        if (response.codigo === 0) {
          const works: Work[] = response.data.map(obra => ({
            id: obra.IdObra,
            code: obra.Codigo,
            name: obra.Obra,
            address: obra.Direccion,
            communeId: obra.IdComuna,
            commune: obra.Comuna,
            startDate: obra.FechaInicio,
            endDate: obra.FechaTermino,
            observations: obra.Observaciones
          }));
          this.works = works;
          this.dataSource.data = works;
          
          // Extract unique communes from the response
          const uniqueCommunesMap = new Map<string, {id: string, name: string}>();
          response.data.forEach(obra => {
            if (obra.IdComuna && obra.Comuna) {
              uniqueCommunesMap.set(obra.IdComuna, { id: obra.IdComuna, name: obra.Comuna });
            }
          });
          this.communes = Array.from(uniqueCommunesMap.values());
        } else {
          this.showMessage(`Error: ${response.glosa}`);
        }
      },
      error: (error) => {
        console.error('Error fetching works', error);
        this.showMessage('Error al cargar datos de obras');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  save() {
    // In a real implementation, this would call the API to save the data
    const work = { ...this.workForm };

    if (this.isEditing && this.editingIndex !== null) {
      this.works[this.editingIndex] = { 
        id: work.id,
        code: work.code,
        name: work.name,
        commune: work.commune,
        startDate: work.startDate,
        endDate: work.endDate,
        observations: work.observations,
        address: work.address,
        communeId: work.communeId
      };
      this.dataSource.data = [...this.works]; // Create new reference to trigger change detection
      this.showMessage('Obra actualizada correctamente');
    } else {
      // For now, just update local data
      // In real implementation, would call API first then update local data on success
      this.works.push({
        id: (Math.floor(Math.random() * 1000)).toString(), // Temporary ID
        code: work.code,
        name: work.name,
        commune: work.commune,
        startDate: work.startDate,
        endDate: work.endDate,
        observations: work.observations,
        address: work.address,
        communeId: work.communeId
      });
      this.dataSource.data = [...this.works];
      this.showMessage('Obra agregada correctamente');
    }

    this.cancel();
  }

  edit(index: number) {
    const w = this.works[index];
    this.workForm = {
      id: w.id,
      code: w.code,
      name: w.name,
      commune: w.commune,
      communeId: w.communeId || '',
      startDate: w.startDate,
      endDate: w.endDate,
      observations: w.observations || '',
      address: w.address || '',
    };
    this.isEditing = true;
    this.editingIndex = index;
  }

  delete(index: number) {
    // In a real implementation, this would call an API to delete the record
    this.works.splice(index, 1);
    this.dataSource.data = [...this.works]; // Create new reference to trigger change detection
    this.cancel();
    this.showMessage('Obra eliminada correctamente');
  }

  cancel() {
    this.workForm = {
      id: '',
      code: '',
      name: '',
      address: '',
      startDate: '',
      endDate: '',
      communeId: '',
      commune: '',
      observations: '',
    };
    this.isEditing = false;
    this.editingIndex = null;
  }

  showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  // Format date for display (if needed)
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  }
}
