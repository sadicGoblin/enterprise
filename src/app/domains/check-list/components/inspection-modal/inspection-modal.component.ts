import { Component, OnInit, Inject, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ImagenDialogComponent } from './imagen-dialog.component';
import { DateAdapter } from '@angular/material/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { MatTabsModule } from '@angular/material/tabs';
import { CustomSelectComponent, ParameterType } from '../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../core/services/proxy.service';
import { Observable, catchError, finalize, of, map, throwError, forkJoin } from 'rxjs';

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
    MatTabsModule,
    CustomSelectComponent
  ]
})
export class InspectionModalComponent implements OnInit {
  inspectionForm: FormGroup;
  selectedTabIndex = 0;
  // Control para el selector de responsable asignado
  responsableAsignadoControl = new FormControl('');
  
  // Propiedades para control de carga de datos
  isLoadingInspeccion = false;
  errorLoadingInspeccion: string | null = null;
  errorLoadingMessage = '';
  
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

  // Cache para subparámetros por tipo (idEnt)
  private subParametrosCache: Map<number, any[]> = new Map<number, any[]>();
  
  // Cache para usuarios de la obra
  private usuariosCache: Map<string, string> = new Map<string, string>();

  // Constantes para los tipos de subparámetros (idEnt)
  readonly INCIDENCIA_ID_ENT = 24;
  readonly POTENCIAL_RIESGO_ID_ENT = 25; // Asumiendo que este es el correcto
  readonly CLASIFICACION_HALLAZGO_ID_ENT = 26; // Asumiendo que este es el correcto

  /**
   * Obtiene los subparámetros para un idEnt específico
   * @param idEnt ID del tipo de subparámetro
   * @returns Observable con la lista de subparámetros
   */
  private getSubParametros(idEnt: number): Observable<any[]> {
    // Si ya tenemos los datos en caché, los devolvemos
    if (this.subParametrosCache.has(idEnt)) {
      return of(this.subParametrosCache.get(idEnt) || []);
    }

    // Preparar el cuerpo de la solicitud
    const requestBody = {
      caso: 'SubParametroConsulta',
      idEnt: idEnt
    };

    // Realizar la llamada a la API usando el método post
    return this.proxyService.post<{success: boolean, data: any[]}>('/ws/SubParametrosSvcImpl.php', requestBody)
      .pipe(
        map((response: {success: boolean, data: any[]}) => {
          if (response && response.success && response.data) {
            // Guardar en caché para futuras referencias
            this.subParametrosCache.set(idEnt, response.data);
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error(`Error al obtener subparámetros para idEnt ${idEnt}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene el nombre de un subparámetro por su ID y tipo
   * @param id ID del subparámetro
   * @param idEnt Tipo de subparámetro
   * @returns Observable con el nombre del subparámetro
   */
  private getSubParametroNombre(id: string, idEnt: number): Observable<string> {
    return this.getSubParametros(idEnt).pipe(
      map((subParametros: Array<{IdSubParam: string, Nombre: string}>) => {
        const subParametro = subParametros.find((sp: {IdSubParam: string, Nombre: string}) => sp.IdSubParam === id);
        return subParametro ? subParametro.Nombre : id; // Si no se encuentra, devolvemos el ID
      })
    );
  }
  
  /**
   * Obtiene el nombre del usuario por su ID
   * @param idUsuario ID del usuario
   * @returns Observable con el nombre del usuario
   */
  private getUserNombre(idUsuario: string): Observable<string> {
    // Asegurar que idUsuario sea un string
    const idUsuarioStr = idUsuario.toString().trim();
    console.log(`Llamando a getUserNombre con idUsuario: ${idUsuarioStr} (tipo: ${typeof idUsuarioStr})`);
    
    // Si ya tenemos el usuario en caché, devolvemos su nombre
    if (this.usuariosCache.has(idUsuarioStr)) {
      const nombreCached = this.usuariosCache.get(idUsuarioStr);
      console.log(`Usuario encontrado en caché para ID ${idUsuarioStr}: ${nombreCached}`);
      return of(nombreCached || idUsuarioStr);
    }
    
    // Preparar el cuerpo de la solicitud
    const requestBody = {
      caso: 'ConsultaUsuariosObra',
      idObra: 7, // Usar ID de obra 7 según especificación
      idUsuario: 0 // 0 para traer todos los usuarios
    };
    
    console.log(`Obteniendo nombre para usuario con ID ${idUsuarioStr}, usando requestBody:`, requestBody);
    console.log(`URL completa: /ws/UsuarioSvcImpl.php`);
    
    // Realizar la llamada a la API
    return this.proxyService.post<{success: boolean, data: Array<{IdUsuario: string, nombre: string}>}>('/ws/UsuarioSvcImpl.php', requestBody)
      .pipe(
        map((response: {success: boolean, data: Array<{IdUsuario: string, nombre: string}>}) => {
          console.log('Respuesta de ConsultaUsuariosObra:', response);
          if (response && response.success && response.data) {
            console.log(`Usuarios recibidos: ${response.data.length}`, response.data);
            // Guardar todos los usuarios en caché para futuras referencias
            response.data.forEach(user => {
              // Asegurar que IdUsuario sea un string
              const userId = user.IdUsuario.toString().trim();
              console.log(`Cacheando usuario: ${userId} => ${user.nombre}`);
              this.usuariosCache.set(userId, user.nombre);
            });
            
            // Buscar el usuario por su ID - probándo con strings e integers
            let usuario = response.data.find(u => u.IdUsuario === idUsuarioStr);
            if (!usuario) {
              // Intentar encontrarlo comparando como número
              usuario = response.data.find(u => u.IdUsuario === idUsuarioStr || parseInt(u.IdUsuario) === parseInt(idUsuarioStr));
            }
            
            console.log(`Usuario encontrado para ID ${idUsuarioStr}:`, usuario);
            
            if (usuario) {
              // Guardar el resultado en caché para futuras referencias
              this.usuariosCache.set(idUsuarioStr, usuario.nombre);
              return usuario.nombre;
            }
            return idUsuarioStr; // Si no se encuentra, devolver el ID
          }
          return idUsuarioStr;
        }),
        catchError(error => {
          console.error(`Error al obtener usuarios para idUsuario ${idUsuarioStr}:`, error);
          return of(idUsuarioStr); // En caso de error, devolver el ID original
        })
      );
    }
  
  // Columnas a mostrar en la tabla
  displayedColumns: string[] = [
    'view',
    'condicionRiesgo',
    'incidencia',
    'potencialRiesgo',
    'clasificacionHallazgo',
    'medidaCorrectiva',
    'responsable',
    'fechaCompromisoFormateada',
    'fechaCierreFormateada'
  ];
  
  riskOptions: string[] = ['SEGURIDAD', 'SALUD', 'MEDIO AMBIENTE', 'OTRO'];
  potentialRiskOptions: string[] = ['LEVE', 'MEDIANAMENTE GRAVE', 'GRAVE', 'MUY GRAVE'];
  classificationOptions: string[] = ['OBSERVACIÓN', 'NO CONFORMIDAD', 'POTENCIAL NO CONFORMIDAD'];

  // Datos de inspección SSOMA
  inspeccionSSOMAData: InspeccionSSOMAData[] = [];
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InspectionModalComponent>,
    private dateAdapter: DateAdapter<Date>,
    private cdRef: ChangeDetectorRef,
    private proxyService: ProxyService,
    private dialog: MatDialog, // Añadir MatDialog para abrir el popup de imagen
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
    console.log('Iniciando populateTableFromApiData');
    // Asegurarse de que estamos en modo carga mientras transformamos los datos
    this.isLoadingInspeccion = true;
    
    // Limpiar los elementos existentes
    while (this.items.length > 0) {
      this.items.removeAt(0);
    }
    
    // Si no hay datos, agregar un elemento vacío
    if (!this.inspeccionSSOMAData.length) {
      this.addEmptyItem();
      this.isLoadingInspeccion = false;
      return;
    }
    
    // Formatear fechas en formato DD-MM-YYYY
    const formatearFecha = (fecha: Date): string => {
      if (!fecha) return '';
      try {
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}-${mes}-${anio}`;
      } catch (error) {
        console.error('Error al formatear fecha:', error);
        return '';
      }
    };
    
    // Usaremos un array para recolectar todas las operaciones asincrónicas
    const observables: Observable<any>[] = [];
    
    // Para cada item de inspección, creamos un observable que completa todos los pasos
    this.inspeccionSSOMAData.forEach(data => {
      const d = data as any;
      
      // Extraer datos básicos
      const condicionRiesgo = d['CondicionRiesgo'] || '';
      const incidenciaId = d['IdIncidencia'] || '';
      const potencialRiesgoId = d['IdPotencialRiesgo'] || '';
      const clasificacionHallazgoId = d['IdClasificacionHallazgo'] || '';
      const medidaCorrectiva = d['MedidaCorrectiva'] || '';
      
      // Obtener el ID del responsable, asegurándose de que sea un string
      const responsableId = (d['IdRespondable'] || d['IdResponsable'] || '').toString();
      console.log('ID del responsable extraído:', responsableId, typeof responsableId);
      
      // Parsear las fechas
      let fechaCompromiso: Date;
      try {
        fechaCompromiso = d['FechaCompromiso'] ? new Date(d['FechaCompromiso']) : new Date();
      } catch (error) {
        console.error('Error al parsear FechaCompromiso:', error);
        fechaCompromiso = new Date();
      }
      
      let fechaCierre: Date;
      try {
        fechaCierre = d['FechaCierreFirma'] ? new Date(d['FechaCierreFirma']) : new Date();
      } catch (error) {
        console.error('Error al parsear FechaCierreFirma:', error);
        fechaCierre = new Date();
      }
      
      // Crear un objeto con las observables para obtener los nombres descriptivos
      const itemObservables = {
        incidencia: this.getSubParametroNombre(incidenciaId, this.INCIDENCIA_ID_ENT),
        potencialRiesgo: this.getSubParametroNombre(potencialRiesgoId, this.POTENCIAL_RIESGO_ID_ENT),
        clasificacionHallazgo: this.getSubParametroNombre(clasificacionHallazgoId, this.CLASIFICACION_HALLAZGO_ID_ENT),
        responsable: this.getUserNombre(responsableId)
      };
      
      // Crear un observable para procesar este item
      const itemObservable = forkJoin(itemObservables).pipe(
        map(resultados => {
          console.log('Nombres descriptivos obtenidos:', resultados);
          
          // Capturar la foto en base64 si existe
          const foto = d['foto'] || null;
          console.log('Foto en base64 encontrada:', foto ? 'Sí, longitud: ' + foto.length : 'No disponible');
          
          // Crear un FormGroup para el item usando los campos formateados directamente
          const item = this.fb.group({
            condicionRiesgo: [condicionRiesgo || 'Sin condición de riesgo', Validators.required],
            incidencia: [resultados.incidencia || 'Sin incidencia', Validators.required],
            potencialRiesgo: [resultados.potencialRiesgo || 'Sin potencial de riesgo', Validators.required],
            clasificacionHallazgo: [resultados.clasificacionHallazgo || 'Sin clasificación', Validators.required],
            medidaCorrectiva: [medidaCorrectiva || 'Sin medida correctiva', Validators.required],
            responsable: [resultados.responsable || 'Sin responsable asignado', Validators.required],
            // Usar directamente las fechas formateadas
            fechaCompromisoFormateada: [formatearFecha(fechaCompromiso), Validators.required],
            fechaCierreFormateada: [formatearFecha(fechaCierre), Validators.required],
            // Guardar la foto en base64
            foto: [foto]
          });
          
          console.log('FormGroup creado con datos traducidos:', item.value);
          this.items.push(item);
          return item; // Retornar el item para uso posterior si es necesario
        }),
        catchError(error => {
          console.error('Error al obtener nombres descriptivos:', error);
          // Capturar la foto en base64 si existe incluso en caso de error
          const foto = d['foto'] || null;
          
          // En caso de error, crear el item con los IDs originales
          const item = this.fb.group({
            condicionRiesgo: [condicionRiesgo || 'Sin condición de riesgo', Validators.required],
            incidencia: [incidenciaId || 'Sin incidencia', Validators.required],
            potencialRiesgo: [potencialRiesgoId || 'Sin potencial de riesgo', Validators.required],
            clasificacionHallazgo: [clasificacionHallazgoId || 'Sin clasificación', Validators.required],
            medidaCorrectiva: [medidaCorrectiva || 'Sin medida correctiva', Validators.required],
            responsable: [responsableId || 'Sin responsable asignado', Validators.required],
            fechaCompromisoFormateada: [formatearFecha(fechaCompromiso), Validators.required],
            fechaCierreFormateada: [formatearFecha(fechaCierre), Validators.required],
            foto: [foto] // Incluir la foto incluso en caso de error
          });
          
          console.log('FormGroup creado con IDs originales (debido a error):', item.value);
          this.items.push(item);
          return of(item); // Convertir a observable para mantener la cadena
        })
      );
      
      observables.push(itemObservable);
    });
    
    // Procesar todos los items en paralelo
    forkJoin(observables.length ? observables : [of(null)])
      .pipe(
        finalize(() => {
          // Comprobar si hay items cargados, si no, agregar uno vacío
          if (this.items.length === 0) {
            console.log('No se encontraron datos válidos en la respuesta de la API, agregando item por defecto');
            this.addEmptyItem();
          }
          
          // Actualizar otros campos del formulario principal si es necesario
          if (this.inspeccionSSOMAData.length > 0) {
            const firstItem = this.inspeccionSSOMAData[0] as any;
            try {
              // Sólo actualizamos el tipo de inspección, mantenemos otros valores iniciales
              this.inspectionForm.patchValue({
                inspectionType: firstItem['Programada'] === '1' ? 'programmed' : 'informal'
              });
              console.log('Formulario principal actualizado:', this.inspectionForm.value);
            } catch (error) {
              console.error('Error al actualizar el formulario principal:', error);
            }
          }
          
          // Finalizar carga y mostrar tabla
          this.isLoadingInspeccion = false;
          console.log('isLoadingInspeccion establecido a false, la tabla debería ser visible ahora');
          // Forzar la detección de cambios para asegurar que la tabla se muestre
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (results) => {
          console.log('Todos los items procesados exitosamente:', results ? results.length : 0);
        },
        error: (error) => {
          console.error('Error general al procesar items:', error);
          // Asegurar que la tabla se muestre incluso en caso de error
          this.isLoadingInspeccion = false;
          
          // Si no hay items, agregar uno vacío
          if (this.items.length === 0) {
            this.addEmptyItem();
          }
          
          // Forzar la detección de cambios para asegurar que la tabla se muestre incluso en caso de error
          this.cdRef.detectChanges();
        }
      });
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
      fechaCierre: [new Date(), Validators.required],
      fechaCompromisoFormateada: ['', Validators.required],
      fechaCierreFormateada: ['', Validators.required],
      foto: [null] // Agregar campo para foto en base64
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
      fechaCierre: [new Date(), Validators.required],
      fechaCompromisoFormateada: ['', Validators.required],
      fechaCierreFormateada: ['', Validators.required]
    });

    this.items.push(item);
  }

  /**
   * Elimina un ítem de la tabla
   * @param index Índice del ítem a eliminar
   */
  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  /**
   * Muestra una imagen en base64 en un popup
   * @param imagenBase64 Imagen en formato base64
   */
  mostrarImagenEnPopup(imagenBase64: string | null): void {
    if (!imagenBase64) {
      console.warn('No hay imagen disponible para mostrar');
      return;
    }

    // Validar que la imagen esté en formato base64
    if (!imagenBase64.startsWith('data:image')) {
      // Si no empieza con data:image, añadimos el prefijo para formato PNG
      imagenBase64 = 'data:image/png;base64,' + imagenBase64;
    }
    
    // Abrir diálogo con la imagen
    this.dialog.open(ImagenDialogComponent, {
      data: { imagenSrc: imagenBase64 },
      panelClass: 'imagen-dialog-panel',
      autoFocus: false,
      disableClose: false,
      // No especificamos ancho ni posición para permitir que los estilos CSS controlen el centrado
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms'
    });
  }
  
  /**
   * Cierra el diálogo sin guardar cambios
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Genera un PDF con los datos del formulario
   */
  saveAsPDF(): void {
    // En producción, implementar la lógica de guardar como PDF
    console.log('Guardar como PDF', this.inspectionForm.value);
  }

  /**
   * Exporta la vista previa a PDF utilizando la función de impresión del navegador
   */
  exportToPDF(): void {
    console.log('Exportando a PDF');
    
    // Obtener datos para el PDF
    const formData = this.inspectionForm.value;
    const tipo = formData.inspectionType === 'programada' ? 'Programada' : 'Informal';
    const fecha = formData.date ? new Date(formData.date) : new Date();
    const fechaStr = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
    const realizadoPor = formData.realizadoPor || '';

    // Abrir una nueva ventana
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes e intente de nuevo.');
      return;
    }

    // Preparar contenido HTML para la impresión
    printWindow.document.write(`
      <html>
        <head>
          <title>Inspección SSTMA</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 20px;
            }
            .logo {
              width: 100px;
              margin-right: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              flex-grow: 1;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .info-table td {
              padding: 5px;
            }
            .info-table tr td:first-child {
              font-weight: bold;
              width: 120px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .data-table th, .data-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            .data-table th {
              background-color: #f2f2f2;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="assets/images/logo.png" class="logo" onerror="this.src='https://via.placeholder.com/100x50?text=INARCO'" />
            <div class="title">Inspección SSTMA</div>
          </div>
          
          <table class="info-table">
            <tr>
              <td>Tipo</td>
              <td>${tipo}</td>
              <td rowspan="3" style="text-align: right;">Observaciones</td>
            </tr>
            <tr>
              <td>Fecha/Hora</td>
              <td>${fechaStr}</td>
            </tr>
            <tr>
              <td>Realizado por</td>
              <td>${realizadoPor}</td>
            </tr>
          </table>
          
          <table class="data-table">
            <thead>
              <tr>
                <th>C.Riesgo</th>
                <th>Incidencia</th>
                <th>Pot.Riesgo</th>
                <th>Clasificación H.</th>
                <th>Medida Correctiva</th>
                <th>Resp.</th>
                <th>F.Comp</th>
                <th>Cierre</th>
              </tr>
            </thead>
            <tbody>
    `);

    // Añadir filas de datos de inspección
    const items = this.inspectionForm.get('items') as FormArray;
    if (items && items.length > 0) {
      items.controls.forEach(item => {
        const itemData = item.value;
        const fechaCompromiso = itemData.fechaCompromiso ? new Date(itemData.fechaCompromiso) : new Date();
        const fechaCierre = itemData.fechaCierre ? new Date(itemData.fechaCierre) : new Date();
        const fechaCompromisoStr = `${fechaCompromiso.getDate().toString().padStart(2, '0')}-${(fechaCompromiso.getMonth() + 1).toString().padStart(2, '0')}-${fechaCompromiso.getFullYear()}`;
        const fechaCierreStr = `${fechaCierre.getDate().toString().padStart(2, '0')}-${(fechaCierre.getMonth() + 1).toString().padStart(2, '0')}-${fechaCierre.getFullYear()}`;
        
        printWindow.document.write(`
              <tr>
                <td>${itemData.condicionRiesgo || 'TEST'}</td>
                <td>${itemData.incidencia || 'SEGURIDAD'}</td>
                <td>${itemData.potencialRiesgo || 'MEDIANAMENTE GRAVE'}</td>
                <td>${itemData.clasificacionHallazgo || ''}</td>
                <td>${itemData.medidaCorrectiva || 'REVISAR TEST'}</td>
                <td>${itemData.responsable || 'GERMAN MEDINA'}</td>
                <td>${fechaCompromisoStr || '22-04-2025'}</td>
                <td>${fechaCierreStr || '22-04-2025'}</td>
              </tr>
        `);
      });
    } else {
      // Si no hay elementos, añadir una fila de ejemplo
      printWindow.document.write(`
              <tr>
                <td>TEST</td>
                <td>SEGURIDAD</td>
                <td>MEDIANAMENTE GRAVE</td>
                <td></td>
                <td>REVISAR TEST</td>
                <td>GERMAN MEDINA</td>
                <td>22-04-2025</td>
                <td>22-04-2025</td>
              </tr>
      `);
    }

    // Finalizar HTML y activar impresión
    printWindow.document.write(`
            </tbody>
          </table>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print(); setTimeout(() => window.close(), 500);">Imprimir PDF</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Esperar a que se cargue el contenido y luego imprimir
    setTimeout(() => {
      printWindow.focus();
      // La impresión se maneja mediante el botón en la página
    }, 1000);
  }

  /**
   * Guarda los cambios y cierra el diálogo
   */
  onSave(): void {
    if (this.inspectionForm.valid) {
      this.dialogRef.close(this.inspectionForm.value);
    } else {
      // Marcar todos los controles como tocados para mostrar errores
      this.markFormGroupTouched(this.inspectionForm);
    }
  }

  /**
   * Marca todos los controles de un FormGroup como tocados para mostrar errores
   * @param formGroup FormGroup cuyos controles se marcarán como tocados
   */
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
