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
    // Initialize form with FormBuilder and validation rules
    this.workForm = this.fb.group({
      IdObra: [''],
      Codigo: ['', [Validators.required]],
      Obra: ['', [Validators.required]],
      Direccion: ['', [Validators.required]],
      FechaInicio: ['', [Validators.required]],
      FechaTermino: ['', [Validators.required]],
      IdComuna: ['', [Validators.required]],
      Comuna: [''],
      IdRegion: ['', [Validators.required]],
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
    // First validate the form
    if (this.workForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.workForm.controls).forEach(key => {
        const control = this.workForm.get(key);
        control?.markAsTouched();
      });
      
      this.showMessage('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Perform date validation
    const startDate = this.workForm.get('FechaInicio')?.value;
    const endDate = this.workForm.get('FechaTermino')?.value;
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      this.showMessage('La fecha de término debe ser posterior a la fecha de inicio');
      return;
    }
    
    // Form is valid, proceed with save/update
    if (this.isEditing && this.editingIndex !== null) {
      // Si estamos editando, actualizar la obra existente
      this.updateWork();
    } else {
      // Si no estamos editando, añadir nueva obra
      this.addWork();
    }
  }
  
  addWork(): void {
    this.isLoading = true;
    
    // Format the dates as expected by the API (YYYY-MM-DD)
    const formValue = this.workForm.value;
    const startDate = formValue.FechaInicio ? new Date(formValue.FechaInicio) : null;
    const endDate = formValue.FechaTermino ? new Date(formValue.FechaTermino) : null;
    
    // Prepare data for the API
    const obraData = {
      obra: formValue.Obra,
      codigo: formValue.Codigo,
      direccion: formValue.Direccion,
      idComuna: formValue.IdComuna,
      fechaInicio: startDate ? startDate.toISOString().split('T')[0] : '',
      fechaTermino: endDate ? endDate.toISOString().split('T')[0] : '',
      observaciones: formValue.Observaciones || ''
    };
    
    console.log('Añadiendo obra:', obraData);
    
    this.obraService.createObra(obraData).subscribe({
      next: (response) => {
        console.log('Respuesta de creación:', response);
        if (response.success === true || response.codigo === 0) {
          this.showMessage('Obra creada correctamente');
          this.resetForm();
          this.fetchWorks(); // Refresh the list
        } else {
          const errorMsg = response.message || response.glosa || 'Error desconocido';
          this.showMessage(`Error al crear obra: ${errorMsg}`);
        }
      },
      error: (error) => {
        console.error('Error al crear obra', error);
        this.showMessage('Error al crear obra. Por favor, inténtelo de nuevo.');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  
  updateWork(): void {
    this.isLoading = true;
    
    // Format the dates as expected by the API (YYYY-MM-DD)
    const formValue = this.workForm.value;
    const startDate = formValue.FechaInicio ? new Date(formValue.FechaInicio) : null;
    const endDate = formValue.FechaTermino ? new Date(formValue.FechaTermino) : null;
    
    // Prepare data for the API
    const obraData = {
      idObra: formValue.IdObra,
      obra: formValue.Obra,
      codigo: formValue.Codigo,
      direccion: formValue.Direccion,
      idComuna: formValue.IdComuna,
      fechaInicio: startDate ? startDate.toISOString().split('T')[0] : '',
      fechaTermino: endDate ? endDate.toISOString().split('T')[0] : '',
      observaciones: formValue.Observaciones || ''
    };
    
    console.log('Actualizando obra:', obraData);
    
    this.obraService.updateObra(obraData).subscribe({
      next: (response) => {
        console.log('Respuesta de actualización:', response);
        if (response.success === true || response.codigo === 0) {
          this.showMessage('Obra actualizada correctamente');
          this.resetForm();
          this.isEditing = false;
          this.editingIndex = null;
          this.fetchWorks(); // Refresh the list
        } else {
          const errorMsg = response.message || response.glosa || 'Error desconocido';
          this.showMessage(`Error al actualizar obra: ${errorMsg}`);
        }
      },
      error: (error) => {
        console.error('Error al actualizar obra', error);
        this.showMessage('Error al actualizar obra. Por favor, inténtelo de nuevo.');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
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
