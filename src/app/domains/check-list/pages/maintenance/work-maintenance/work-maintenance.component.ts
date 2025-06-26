import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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

// Import custom select component
import { CustomSelectComponent, ParameterType, SelectOption } from '../../../../../shared/controls/custom-select/custom-select.component';

import { ObraService } from '../../../services/obra.service';
import { Obra, ObrasFullResponse } from '../../../models/obra.models';

// Interfaz que coincide con la respuesta de la API de obras
interface Work {
  IdObra: string;
  Codigo: string;
  Obra: string;
  Direccion?: string;
  IdComuna?: string;
  Comuna?: string;
  IdRegion?: string;
  Region?: string;
  FechaInicio: string;
  FechaTermino: string;
  Observaciones?: string;
}

@Component({
  selector: 'app-work-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    CustomSelectComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './work-maintenance.component.html',
  styleUrls: ['./work-maintenance.component.scss']
})
export class WorkMaintenanceComponent implements OnInit, AfterViewInit {
  // Exponer el enum ParameterType para usarlo en el template
  ParameterType = ParameterType;

  // Referencias a los componentes custom-select
  @ViewChild('regionSelect') regionSelect!: CustomSelectComponent;
  @ViewChild('communeSelect') communeSelect!: CustomSelectComponent;

  // Region and Commune API configuration
  regionRequestBody = { caso: 'RegionesConsulta' };
  communeRequestBody = { caso: 'ComunaConsulta', idRegion: '' };

  workForm: FormGroup;

  // Will be populated dynamically from API response
  communes: { id: string, name: string }[] = [];
  regions: { id: string, name: string }[] = [];

  works: Work[] = [];
  dataSource = new MatTableDataSource<Work>(this.works);

  isEditing = false;
  editingIndex: number | null = null;
  isLoading = false;
  displayedColumns = ['code', 'name', 'commune', 'startDate', 'endDate', 'actions'];

  constructor(
    private fb: FormBuilder,
    private obraService: ObraService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar el formulario al crear el componente
    this.workForm = this.fb.group({
      IdObra: [''],
      Codigo: [''],
      Obra: [''],
      Direccion: [''],
      FechaInicio: [''],
      FechaTermino: [''],
      IdComuna: [''],
      Comuna: [''],
      IdRegion: [''],
      Region: [''],
      Observaciones: [''],
    });
    this.initForm();
  }

  ngOnInit(): void {
    this.fetchWorks();
  }

  ngAfterViewInit(): void {
    // Suscribirse a los eventos de carga de opciones si es necesario
    if (this.communeSelect) {
      this.communeSelect.optionsLoaded.subscribe((options: SelectOption[]) => {
        console.log('Comunas cargadas:', options);
      });
    }
  }

  fetchWorks(): void {
    this.isLoading = true;
    this.obraService.getObras().subscribe({
      next: (response) => {
        console.log('[WorkMaintenanceComponent] API Response:', response);
        
        // Check for successful response (supporting both new and legacy formats)
        if (response.success === true || response.codigo === 0) {
          const works: Work[] = response.data.map(obra => ({
            IdObra: obra.IdObra,
            Codigo: obra.Codigo,
            Obra: obra.Obra,
            Direccion: obra.Direccion,
            IdComuna: obra.IdComuna,
            Comuna: obra.Comuna,
            IdRegion: obra.IdRegion,
            Region: obra.Region,
            FechaInicio: obra.FechaInicio,
            FechaTermino: obra.FechaTermino,
            Observaciones: obra.Observaciones
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

          // Extract unique regions from the response
          const uniqueRegionsMap = new Map<string, {id: string, name: string}>();
          response.data.forEach(obra => {
            if (obra.IdRegion && obra.Region) {
              uniqueRegionsMap.set(obra.IdRegion, { id: obra.IdRegion, name: obra.Region });
            }
          });
          this.regions = Array.from(uniqueRegionsMap.values());
        } else {
          // Use either new or legacy error message
          const errorMsg = response.message || response.glosa || 'Error desconocido';
          this.showMessage(`Error: ${errorMsg}`);
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

  initForm() {
    // Initialize form with FormBuilder
    this.workForm = this.fb.group({
      IdObra: [''],
      Codigo: [''],
      Obra: [''],
      Direccion: [''],
      FechaInicio: [''],
      FechaTermino: [''],
      IdComuna: [''],
      Comuna: [''],
      IdRegion: [''],
      Region: [''],
      Observaciones: [''],
    });
    
    // Reset commune request body to default
    this.communeRequestBody = {
      caso: 'ComunaConsulta',
      idRegion: ''
    };
  }

  edit(index: number) {
    if (this.works[index]) {
      const work = this.works[index];

      // Map Work properties to workForm usando los nombres correctos de la API
      this.workForm.patchValue({
        IdObra: work.IdObra || '',
        Codigo: work.Codigo || '',
        Obra: work.Obra || '',
        Direccion: work.Direccion || '',
        IdComuna: work.IdComuna || '',
        Comuna: work.Comuna || '',
        IdRegion: work.IdRegion || '',
        Region: work.Region || '',
        FechaInicio: work.FechaInicio || '',
        FechaTermino: work.FechaTermino || '',
        Observaciones: work.Observaciones || '',
      });

      // If region is selected, update commune request body
      if (work.IdRegion) {
        this.communeRequestBody = {
          caso: 'ComunaConsulta',
          idRegion: work.IdRegion
        };
      }
    }
  }

  delete(index: number) {
    // In a real implementation, this would call an API to delete the record
    this.works.splice(index, 1);
    this.dataSource.data = [...this.works]; // Create new reference to trigger change detection
    this.cancel();
    this.showMessage('Obra eliminada correctamente');
  }

  cancel(): void {
    this.isEditing = false;
    this.workForm.reset();
    this.editingIndex = null;
    this.resetForm();
  }
  
  resetForm(): void {
    this.workForm.reset();
    
    // Reset commune request body
    this.communeRequestBody = {
      caso: 'ComunaConsulta',
      idRegion: ''
    };
  }

  save(): void {
    if (this.isEditing && this.editingIndex !== null) {
      // Si estamos editando, actualizar la obra existente
      this.updateWork();
    } else {
      // Si no estamos editando, añadir nueva obra
      this.addWork();
    }
  }
  
  addWork(): void {
    // Aquí implementarías la lógica para añadir una nueva obra
    // usando los datos del formulario workForm
    console.log('Añadiendo obra:', this.workForm.value);
    
    // Después de añadir exitosamente, resetea el formulario
    this.resetForm();
  }
  
  updateWork(): void {
    // Aquí implementarías la lógica para actualizar la obra
    // usando los datos del formulario workForm
    console.log('Actualizando obra:', this.workForm.value);
    
    // Después de actualizar exitosamente, resetea el formulario
    this.resetForm();
  }

  showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Handle region selection change event
   * @param event The selected region option
   */
  onRegionSelectionChange(event: any): void {
    // Update regionName in workForm
    if (event && event.label) {
      this.workForm.get('Region')?.setValue(event.label);
    }

    // Update communeRequestBody based on selected region
    if (event && event.value) {
      this.communeRequestBody = {
        caso: 'ComunaConsulta',
        idRegion: event.value
      };
      
      // Forzar la recarga del select de comunas
      setTimeout(() => {
        if (this.communeSelect) {
          console.log('Recargando comunas para región:', event.value);
          this.communeSelect.loadOptionsFromApi();
        }
      });
    } else {
      // Reset communeRequestBody if no region selected
      this.communeRequestBody = {
        caso: 'ComunaConsulta',
        idRegion: ''
      };
    }

    // Reset commune value since region changed
    this.workForm.get('IdComuna')?.setValue('');
    this.workForm.get('Comuna')?.setValue('');
  }

  /**
   * Handle commune selection change event
   * @param event The selected commune option
   */
  onCommuneSelectionChange(event: any): void {
    // Update commune name in workForm
    if (event && event.label) {
      this.workForm.get('Comuna')?.setValue(event.label);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  }
}
