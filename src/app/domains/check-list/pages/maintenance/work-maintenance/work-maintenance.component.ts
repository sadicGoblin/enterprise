import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Import custom select component
import { CustomSelectComponent, ParameterType, SelectOption } from '../../../../../shared/controls/custom-select/custom-select.component';
import { ObraService } from '../../../services/obra.service';

// Formato de fecha personalizado para Chile (DD/MM/AAAA)
const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
import { Obra, ObrasFullResponse } from '../../../models/obra.models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

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
  docfile?: string; // URL del archivo Excel asociado
}

@Component({
  selector: 'app-work-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
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
    MatDialogModule,
    CustomSelectComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
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
  displayedColumns = ['code', 'name', 'commune', 'startDate', 'endDate', 'excel', 'actions'];

  // Propiedades para manejo de archivos
  selectedFileName: string = '';
  isUploadingFile: boolean = false;
  uploadedFileUrl: string = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private obraService: ObraService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
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
      docfile: ['']
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

  /**
   * Maneja la selección de archivo Excel
   */
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validar tipo de archivo
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xls|xlsx)$/i)) {
        this.showMessage('Por favor seleccione un archivo Excel válido (.xls o .xlsx)');
        return;
      }
      
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.uploadFileToStorage(file);
    }
  }

  /**
   * Sube el archivo al bucket de almacenamiento
   */
  private uploadFileToStorage(file: File): void {
    this.isUploadingFile = true;
    this.uploadedFileUrl = '';
    
    const formData = new FormData();
    formData.append('file', file);
    
    this.http.post<any>('https://inarco-ssoma.favric.cl/bucket/storage', formData).subscribe({
      next: (response) => {
        console.log('Archivo subido correctamente:', response);
        if (response && response.url) {
          this.uploadedFileUrl = response.url;
          this.showMessage('Archivo subido correctamente');
        } else {
          this.showMessage('Error: No se pudo obtener la URL del archivo');
        }
      },
      error: (error) => {
        console.error('Error al subir archivo:', error);
        this.showMessage('Error al subir el archivo. Por favor, inténtelo de nuevo.');
        this.selectedFile = null;
        this.selectedFileName = '';
        this.uploadedFileUrl = '';
      },
      complete: () => {
        this.isUploadingFile = false;
      }
    });
  }

  /**
   * Descarga el archivo Excel asociado a una obra
   */
  downloadExcelFile(fileUrl: string): void {
    if (fileUrl && fileUrl.trim()) {
      // Abrir la URL en una nueva pestaña para descargar el archivo
      window.open(fileUrl, '_blank');
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
            Observaciones: obra.Observaciones,
            docfile: (obra as any).docfile || '' // URL del archivo Excel
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
        FechaInicio: this.parseLocalDate(work.FechaInicio),
        FechaTermino: this.parseLocalDate(work.FechaTermino),
        Observaciones: work.Observaciones || '',
        docfile: work.docfile || ''
      });

      // Configure file upload for editing
      if (work.docfile) {
        this.uploadedFileUrl = work.docfile;
        this.selectedFileName = 'Archivo actual ' + work.docfile;
      } else {
        this.uploadedFileUrl = '';
        this.selectedFileName = '';
      }

      // Marcar como editando y guardar el índice
      this.isEditing = true;
      this.editingIndex = index;

      // If region is selected, update commune request body and load communes
      if (work.IdRegion) {
        this.communeRequestBody = {
          caso: 'ComunaConsulta',
          idRegion: work.IdRegion
        };
        
        // Forzar la carga de comunas para la región seleccionada
        setTimeout(() => {
          if (this.communeSelect) {
            console.log('Cargando comunas para edición de obra. Región:', work.IdRegion);
            this.communeSelect.loadOptionsFromApi();
          }
        }, 100); // Pequeño delay para asegurar que el componente esté listo
      }

      // Mostrar mensaje de edición
      this.showMessage('Editando obra: ' + work.Obra);
    }
  }

  delete(index: number) {
    if (this.works[index]) {
      const work = this.works[index];
      const idObra = work.IdObra;
      
      // Configurar datos para el diálogo de confirmación
      const dialogData: ConfirmDialogData = {
        title: 'Eliminar obra',
        message: `¿Está seguro que desea eliminar la obra '${work.Obra}'?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      };
      
      // Abrir el diálogo de confirmación
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: dialogData
      });
      
      // Manejar la respuesta del diálogo
      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.isLoading = true;
          
          // Llamar al servicio para eliminar la obra
          this.obraService.deleteObra(idObra).subscribe({
            next: (response) => {
              console.log('Respuesta de eliminación:', response);
              
              if (response.success === true || response.codigo === 0) {
                // Actualizar la lista local si la eliminación fue exitosa
                this.works.splice(index, 1);
                this.dataSource.data = [...this.works]; // Crear nueva referencia para activar detección de cambios
                this.showMessage('Obra eliminada correctamente');
              } else {
                const errorMsg = response.message || response.glosa || 'Error desconocido';
                this.showMessage(`Error al eliminar obra: ${errorMsg}`);
              }
            },
            error: (error) => {
              console.error('Error al eliminar obra', error);
              this.showMessage('Error al eliminar obra. Por favor, inténtelo de nuevo.');
              this.isLoading = false;
            },
            complete: () => {
              this.isLoading = false;
              this.cancel(); // Resetear el formulario y estado de edición
            }
          });
        }
      });
    }
  }

  cancel(): void {
    this.isEditing = false;
    this.workForm.reset();
    this.editingIndex = null;
    this.resetForm();
  }
  
  resetForm(): void {
    this.workForm.reset();
    
    // Limpiar todos los estados de validación
    Object.keys(this.workForm.controls).forEach(key => {
      this.workForm.get(key)?.setErrors(null);
      this.workForm.get(key)?.markAsUntouched();
      this.workForm.get(key)?.markAsPristine();
    });
    
    // Reset commune request body
    this.communeRequestBody = {
      caso: 'ComunaConsulta',
      idRegion: ''
    };

    // Reset file upload properties
    this.selectedFile = null;
    this.selectedFileName = '';
    this.uploadedFileUrl = '';
    this.isUploadingFile = false;
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
    const userId = localStorage.getItem('userId') || '';
    const obraData = {
      obra: formValue.Obra,
      codigo: formValue.Codigo,
      direccion: formValue.Direccion,
      idComuna: formValue.IdComuna,
      fechaInicio: startDate ? startDate.toISOString().split('T')[0] : '',
      fechaTermino: endDate ? endDate.toISOString().split('T')[0] : '',
      observaciones: formValue.Observaciones || '',
      docfile: this.uploadedFileUrl || '', // URL del archivo Excel subido
      idUsuario: userId
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
    
    // Format the dates as expected by the API
    const formValue = this.workForm.value;
    const startDate = formValue.FechaInicio ? new Date(formValue.FechaInicio) : null;
    const endDate = formValue.FechaTermino ? new Date(formValue.FechaTermino) : null;
    
    // Prepare data for the API with the exact format required
    const userId = localStorage.getItem('userId') || '';
    const requestBody = {
      caso: "Actualiza",
      idObra: formValue.IdObra,
      obra: formValue.Obra,
      codigo: formValue.Codigo,
      direccion: formValue.Direccion || "",
      idComuna: formValue.IdComuna,
      comuna: formValue.Comuna || "",  // Usar el valor real de la comuna seleccionada
      fechaInicio: startDate ? startDate.toISOString() : "",
      fechaTermino: endDate ? endDate.toISOString() : "",
      observaciones: formValue.Observaciones || "",
      docfile: this.uploadedFileUrl || "",
      idUsuario: userId
    };
    
    // Mostrar el request body en consola para verificación
    console.log('Request body para actualizar obra:');
    console.log(JSON.stringify(requestBody, null, 2));
    
    // Realizar la llamada a la API
    this.obraService.updateObra(requestBody).subscribe({
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
    
    // Parsear fecha manualmente para evitar problemas de zona horaria
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}-${month}-${year}`;
    }
    
    // Fallback si el formato no es el esperado
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-CL');
  }

  /**
   * Convierte fecha string YYYY-MM-DD a Date sin problemas de zona horaria
   */
  private parseLocalDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Los meses en JS son 0-indexados
      const day = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    
    return null;
  }
}
