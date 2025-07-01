import { Component, OnInit, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomSelectComponent, ParameterType } from '../../../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../../../core/services/proxy.service';
import { Observable, catchError, finalize, of } from 'rxjs';

interface InspectionItem {
  id?: number;
  condicionRiesgo: string;
  incidencia: string;
  potencialRiesgo: string;
  clasificacionHallazgo: string;
  medidaCorrectiva: string;
  responsable: string;
  fechaCompromiso: Date;
  fechaCierre: Date;
}

// Interfaz para la respuesta de la API de inspección SSOMA
interface InspeccionSSOMAResponse {
  codigo: number;
  glosa: string;
  data: InspeccionSSOMAData[];
}

// Datos de inspección SSOMA de la API
interface InspeccionSSOMAData {
  Programada: string;
  Informal: string;
  FechaHora: string;
  IdRealizadoPor: string;
  CondicionRiesgo: string;
  IdIncidencia: string;
  IdPotencialRiesgo: string;
  IdClasificacionHallazgo: string;
  MedidaCorrectiva: string;
  IdRespondable: string;
  FechaCompromiso: string;
  FechaCierreFirma: string;
  // Otros campos que puedan venir en la respuesta
  [key: string]: string;
}

interface UserOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-inspection-modal',
  templateUrl: './inspection-modal.component.html',
  styleUrls: ['./inspection-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatRadioModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CustomSelectComponent
  ]
})
export class InspectionModalComponent implements OnInit, AfterViewInit {
  inspectionForm: FormGroup;
  selectedTabIndex = 0;
  // Control para el selector de responsable asignado
  responsableAsignadoControl = new FormControl('');
  
  // Referencia al componente custom-select para poder recargar opciones
  @ViewChild(CustomSelectComponent) responsableSelect!: CustomSelectComponent;

  // Parámetro para tipo de carga (API personalizada)
  responsableParameterType = ParameterType.CUSTOM_API;

  // Objeto de solicitud para cargar usuarios por obra
  usuariosObraRequestBody = {
    caso: 'ConsultaUsuariosObra',
    idObra: 0, // Será actualizado con el ID del proyecto seleccionado
    idUsuario: 0
  };

  // Columnas de la tabla de inspecciones
  displayedColumns: string[] = [
    'view',
    'condicionRiesgo', 
    'incidencia', 
    'potencialRiesgo', 
    'clasificacionHallazgo', 
    'medidaCorrectiva', 
    'responsable', 
    'fechaCompromiso', 
    'fechaCierre'
  ];
  
  // Opciones ficticias para los selects, normalmente vendrían de un servicio
  userOptions: UserOption[] = [
    { id: '1', name: 'FELIPE GALLARDO' },
    { id: '2', name: 'GERMAN MEDINA' },
    { id: '3', name: 'JUAN PÉREZ' },
  ];
  
  riskOptions: string[] = ['SEGURIDAD', 'SALUD', 'MEDIO AMBIENTE', 'OTRO'];
  potentialRiskOptions: string[] = ['LEVE', 'MEDIANAMENTE GRAVE', 'GRAVE', 'MUY GRAVE'];
  classificationOptions: string[] = ['OBSERVACIÓN', 'NO CONFORMIDAD', 'POTENCIAL NO CONFORMIDAD'];

  // Datos de inspección SSOMA cargados desde la API
  inspeccionSSOMAData: InspeccionSSOMAData[] = [];
  isLoadingInspeccion: boolean = false;
  errorLoadingInspeccion: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InspectionModalComponent>,
    private dateAdapter: DateAdapter<Date>,
    private proxyService: ProxyService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.dateAdapter.setLocale('es');
    
    // Inicializar el control de responsable asignado
    this.responsableAsignadoControl = new FormControl('');
    
    // Actualizar el objeto de solicitud con el ID del proyecto si está disponible
    if (this.data && this.data.projectId) {
      this.usuariosObraRequestBody.idObra = this.data.projectId;
    }

    // Inicializar el formulario reactivo
    this.inspectionForm = this.fb.group({
      date: [new Date(), Validators.required],
      realizadoPor: [{value: this.data?.collaboratorName || '', disabled: true}, Validators.required],
      responsableAsignado: ['', Validators.required],
      inspectionType: ['programada', Validators.required],
      observation: [''],
      items: this.fb.array([])
    });

    console.log('Collaborator name recibido:', this.data?.collaboratorName);
  }

  ngOnInit(): void {
    // Si hay datos de la actividad, cargar los detalles de inspección
    if (this.data?.idControl && this.data?.day) {
      console.log('Cargando datos de inspección SSOMA para idControl:', this.data.idControl, 'día:', this.data.day);
      this.loadInspeccionSSOMAData(this.data.idControl, this.data.day);
    } else {
      console.log('No se recibieron idControl y/o day, agregando item vacío');
      // Si no hay datos, inicializar con un ítem vacío
      this.addEmptyItem();
    }
  }

  ngAfterViewInit(): void {
    // Esperamos a que la vista esté lista para recargar las opciones
    setTimeout(() => {
      if (this.responsableSelect && this.data && this.data.projectId) {
        // Aseguramos que el idObra esté actualizado con el projectId antes de recargar las opciones
        this.usuariosObraRequestBody.idObra = parseInt(this.data.projectId, 10) || 0;
        
        console.log('Recargando opciones de usuarios para la obra:', this.data.projectId);
        console.log('Request body para consulta de usuarios:', this.usuariosObraRequestBody);
        
        // Forzamos la recarga de opciones del select
        this.responsableSelect.reloadOptions();
      } else {
        console.warn('No se puede cargar usuarios de obra:', {
          responsableSelect: !!this.responsableSelect,
          data: !!this.data,
          projectId: this.data?.projectId
        });
      }
    }, 1000);
  }

  get items(): FormArray {
    return this.inspectionForm.get('items') as FormArray;
  }

  /**
   * Carga los datos de inspección SSOMA desde la API
   * @param idControl ID de control de la actividad
   * @param day Día seleccionado
   */
  loadInspeccionSSOMAData(idControl: string, day: number): void {
    this.isLoadingInspeccion = true;
    this.errorLoadingInspeccion = null;
    
    // Crear el request body para la API
    const requestBody = {
      caso: 'ConsultaInspeccionSSOMA',
      idInspeccionSSOMA: 0,
      idControl: parseInt(idControl, 10), // Convertir a número entero
      dia: day,
      programada: 0,
      informal: 0,
      fechaHora: '0001-01-01T00:00:00',
      idRealizadoPor: 0,
      realizadoPor: null,
      observaciones: null
    };
    
    console.log('Enviando request a ActividadSvcImpl.php:', requestBody);
    
    this.proxyService.post<InspeccionSSOMAResponse>('/ws/ActividadSvcImpl.php', requestBody)
      .pipe(
        catchError(error => {
          console.error('Error al cargar datos de inspección SSOMA:', error);
          this.errorLoadingInspeccion = 'Error al cargar los datos de inspección. Por favor, intente nuevamente.';
          return of({ codigo: -1, glosa: 'Error', data: [] } as InspeccionSSOMAResponse);
        }),
        finalize(() => {
          this.isLoadingInspeccion = false;
        })
      )
      .subscribe(response => {
        console.log('Respuesta de API ActividadSvcImpl:', response);
        if (response.data && response.data.length > 0) {
          this.inspeccionSSOMAData = response.data;
          this.populateTableFromApiData();
        } else {
          console.warn('No se encontraron datos de inspección SSOMA o la respuesta no fue exitosa');
        }
      });
  }
  
  /**
   * Rellena la tabla con los datos recibidos de la API
   */
  populateTableFromApiData(): void {
    // Limpiar items existentes
    while (this.items.length > 0) {
      this.items.removeAt(0);
    }
    
    // Si no hay datos, agregar un item en blanco
    if (!this.inspeccionSSOMAData.length) {
      this.addEmptyItem();
      return;
    }
    console.log('Datos de inspección SSOMA:', this.inspeccionSSOMAData);
    
    // Iterar sobre los datos de la API y crear items en la tabla
    this.inspeccionSSOMAData.forEach(data => {
      console.log('Item de inspección:', data);
      // Mostrar todas las propiedades del objeto
      console.log('Propiedades disponibles en data:', Object.keys(data));
      
      // Tratar el objeto data como any para un acceso más flexible a propiedades
      const d = data as any;
      
      // Variables para almacenar los datos extraídos - usando let para permitir reasignaciones
      let condicionRiesgo = '';
      let incidencia = '';
      let potencialRiesgo = '';
      let clasificacionHallazgo = '';
      let medidaCorrectiva = '';
      let responsable = '';
      let fechaCompromiso = new Date();
      let fechaCierre = new Date();
      
      // Mostrar todo el objeto para depuración
      console.log('Objeto completo:', JSON.stringify(d));
      
      // Primera estrategia: intentar obtener los datos de campos con nombres específicos
      condicionRiesgo = d['condicionRiesgo'] || d['CondicionRiesgo'] || 
                       d['condicion_riesgo'] || d['CONDICIONRIESGO'] || '';
      
      incidencia = d['incidencia'] || d['Incidencia'] || 
                 d['IdIncidencia'] || d['id_incidencia'] || '';
      
      potencialRiesgo = d['potencialRiesgo'] || d['PotencialRiesgo'] || 
                      d['IdPotencialRiesgo'] || d['id_potencial_riesgo'] || '';
      
      clasificacionHallazgo = d['clasificacionHallazgo'] || d['ClasificacionHallazgo'] || 
                             d['IdClasificacionHallazgo'] || d['id_clasificacion_hallazgo'] || '';
      
      medidaCorrectiva = d['medidaCorrectiva'] || d['MedidaCorrectiva'] || 
                       d['medida_correctiva'] || d['MEDIDACORRECTIVA'] || '';
      
      responsable = d['responsable'] || d['Responsable'] || 
                  d['IdResponsable'] || d['idResponsable'] || d['id_responsable'] || '';
      
      try {
        // Intentar diferentes formatos de nombres de propiedades para las fechas
        const fechaCompromisoData = d['fechaCompromiso'] || d['FechaCompromiso'] || 
                                  d['fecha_compromiso'] || d['FECHACOMPROMISO'];
                                  
        const fechaCierreData = d['fechaCierre'] || d['FechaCierre'] || 
                             d['FechaCierreFirma'] || d['fecha_cierre'] || 
                             d['FECHACIERRE'];
        
        if (fechaCompromisoData) {
          fechaCompromiso = new Date(fechaCompromisoData);
          console.log('Fecha compromiso encontrada:', fechaCompromisoData);
        }
        
        if (fechaCierreData) {
          fechaCierre = new Date(fechaCierreData);
          console.log('Fecha cierre encontrada:', fechaCierreData);
        }
      } catch (error) {
        console.error('Error al convertir fechas:', error);
      }
      
      // Segunda estrategia: si no se encontraron valores, intentar buscarlos en todas las propiedades
      if (!condicionRiesgo && !incidencia && !potencialRiesgo && 
          !clasificacionHallazgo && !medidaCorrectiva && !responsable) {
        
        console.log('No se encontraron valores con nombres específicos, buscando en todas las propiedades');
        
        // Arreglo para almacenar las propiedades no fechas encontradas
        const propiedadesEncontradas: string[] = [];
        
        // Buscar en todas las propiedades
        for (const key of Object.keys(d)) {
          // Si es un string y no es una fecha
          if (typeof d[key] === 'string' && d[key].trim() !== '' && 
             !key.toLowerCase().includes('fecha') && !key.toLowerCase().includes('date') &&
             !key.toLowerCase().includes('id')) {
            
            console.log(`Propiedad encontrada: ${key} = ${d[key]}`);
            propiedadesEncontradas.push(d[key]);
          }
        }
        
        // Asignar las propiedades encontradas en orden
        if (propiedadesEncontradas.length > 0) {
          condicionRiesgo = propiedadesEncontradas[0] || '';
          console.log('Asignando a condicionRiesgo:', condicionRiesgo);
        }
        
        if (propiedadesEncontradas.length > 1) {
          incidencia = propiedadesEncontradas[1] || '';
          console.log('Asignando a incidencia:', incidencia);
        }
        
        if (propiedadesEncontradas.length > 2) {
          potencialRiesgo = propiedadesEncontradas[2] || '';
          console.log('Asignando a potencialRiesgo:', potencialRiesgo);
        }
        
        if (propiedadesEncontradas.length > 3) {
          clasificacionHallazgo = propiedadesEncontradas[3] || '';
          console.log('Asignando a clasificacionHallazgo:', clasificacionHallazgo);
        }
        
        if (propiedadesEncontradas.length > 4) {
          medidaCorrectiva = propiedadesEncontradas[4] || '';
          console.log('Asignando a medidaCorrectiva:', medidaCorrectiva);
        }
        
        if (propiedadesEncontradas.length > 5) {
          responsable = propiedadesEncontradas[5] || '';
          console.log('Asignando a responsable:', responsable);
        }
      }
      
      // Tercera estrategia: si aún no hay datos, usar valores por defecto para al menos mostrar algo
      if (!condicionRiesgo) condicionRiesgo = 'Sin condición de riesgo';
      if (!incidencia) incidencia = 'Sin incidencia';
      if (!potencialRiesgo) potencialRiesgo = 'Sin potencial de riesgo';
      if (!clasificacionHallazgo) clasificacionHallazgo = 'Sin clasificación';
      if (!medidaCorrectiva) medidaCorrectiva = 'Sin medida correctiva';
      if (!responsable) responsable = 'Sin responsable asignado';
      
      // Crear un nuevo item con los datos mapeados correctamente
      const item = this.fb.group({
        condicionRiesgo: [condicionRiesgo, Validators.required],
        incidencia: [incidencia, Validators.required],
        potencialRiesgo: [potencialRiesgo, Validators.required],
        clasificacionHallazgo: [clasificacionHallazgo, Validators.required],
        medidaCorrectiva: [medidaCorrectiva, Validators.required],
        responsable: [responsable, Validators.required],
        fechaCompromiso: [fechaCompromiso, Validators.required],
        fechaCierre: [fechaCierre, Validators.required]
      });
      
      console.log('FormGroup creado:', item.value);
      this.items.push(item);
    });
    
    // Si no se agregaron elementos porque todos los campos estaban vacíos, agregar uno por defecto
    if (this.items.length === 0) {
      console.log('No se encontraron datos válidos en la respuesta de la API, agregando item por defecto');
      this.addEmptyItem();
    }
    
    // Verificar que la tabla se actualice
    console.log('Número total de items creados:', this.items.length);
    console.log('displayedColumns:', this.displayedColumns);
    
    // Actualizar otros campos del formulario si es necesario
    if (this.inspeccionSSOMAData.length > 0) {
      const firstItem = this.inspeccionSSOMAData[0] as any;
      
      try {
        // Asignar valores al formulario principal si están disponibles usando notación de corchetes
        // SÓLO actualizamos el tipo de inspección, manteniemos la fecha actual y el nombre del colaborador
        // que ya se inicializaron correctamente en el constructor
        this.inspectionForm.patchValue({
          inspectionType: firstItem['Programada'] === '1' ? 'programmed' : 'informal',
          // NO actualizamos la fecha ni el realizadoPor aquí para mantener los valores iniciales
        });
        
        console.log('Formulario principal actualizado:', this.inspectionForm.value);
      } catch (error) {
        console.error('Error al actualizar el formulario principal:', error);
      }
    }
  }
  
  /**
   * Agrega un ítem vacío a la tabla
   */
  addEmptyItem(): void {
    const item = this.fb.group({
      condicionRiesgo: ['', Validators.required],
      incidencia: ['', Validators.required],
      potencialRiesgo: ['', Validators.required],
      clasificacionHallazgo: ['', Validators.required],
      medidaCorrectiva: ['', Validators.required],
      responsable: ['', Validators.required],
      fechaCompromiso: [new Date(), Validators.required],
      fechaCierre: [new Date(), Validators.required]
    });

    this.items.push(item);
  }
  
  /**
   * Agrega un nuevo ítem a la tabla
   */
  addItem(): void {
    const item = this.fb.group({
      condicionRiesgo: ['', Validators.required],
      incidencia: ['', Validators.required],
      potencialRiesgo: ['', Validators.required],
      clasificacionHallazgo: ['', Validators.required],
      medidaCorrectiva: ['', Validators.required],
      responsable: ['', Validators.required],
      fechaCompromiso: [new Date(), Validators.required],
      fechaCierre: [new Date(), Validators.required]
    });

    this.items.push(item);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  saveAsPDF(): void {
    // En producción, implementar la lógica de guardar como PDF
    console.log('Guardar como PDF', this.inspectionForm.value);
  }

  onSave(): void {
    if (this.inspectionForm.valid) {
      this.dialogRef.close(this.inspectionForm.value);
    } else {
      // Marcar todos los controles como tocados para mostrar errores
      this.markFormGroupTouched(this.inspectionForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Ya no es necesario onTabChange ya que ahora usamos radio buttons
}
