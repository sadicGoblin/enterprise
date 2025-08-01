import {
  Component,
  OnInit,
  Inject,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CustomSelectComponent,
  ParameterType,
} from '../../../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../../../core/services/proxy.service';
import { Observable, catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { FileService } from '../../../../services/file.service';
import { ModalFileComponent } from '../../../modal-file/modal-file.component';

// Interfaces para las respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// Respuesta de la primera API (ConsultaDetalle)
export interface ConsultaDetalleResponse {
  success: boolean;
  code: number;
  message: string;
  data: ElementoInspeccionar[];
}

export interface ElementoInspeccionar {
  idElementoInspeccionar: string;
  idTrabajoAlturaDetalle: string;
  idTrabajoAltura: string;
  IdSubParam: string;
  elementoInspeccionar: string; // Este es el texto descriptivo
  si: string;
  no: string;
  na: string;
  idResponsable: string;
  fecha: string;
}

// Respuesta de la segunda API (ConsultaLista)
export interface ConsultaListaResponse {
  success: boolean;
  code: number;
  message: string;
  data: ElementoInspeccionarRespuesta[];
}

export interface ElementoInspeccionarRespuesta {
  idTrabajoAlturaDetalle: string;
  idTrabajoAltura: string;
  idElementoInspeccionar: string;
  si: string;
  no: string;
  na: string;
  idResponsable: string;
  fecha: string;
}

// Interface para usuarios
export interface UserOption {
  id: string;
  name: string;
}

// Interface para los items del checklist en el formulario
export interface CheckListItem {
  id: number;
  description: string;
  yes: boolean;
  no: boolean;
  na: boolean;
  date: string; // Siempre usar string para evitar problemas de tipo con el formulario
}

@Component({
  selector: 'app-checklist-modal',
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
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CustomSelectComponent,
  ],
  templateUrl: './checklist-modal.component.html',
  styleUrl: './checklist-modal.component.scss',
})
export class CheckListModalComponent implements OnInit, AfterViewInit {
  checkListForm: FormGroup;
  reviewedByControl = new FormControl('');
  inspectionByControl = new FormControl(''); // Control para el inspector en la sección superior
  currentRecord = 1;
  totalRecords = 1;
  isLoading = false;
  errorLoading = '';
  isReviewed = false; // Propiedad para controlar si el checklist ha sido revisado
  name = '';
  defaultCollaboratorId: string | null = null;
  defaultCollaboratorName: string | null = null;
  collaboratorParameterType = ParameterType.CUSTOM_API;

  @ViewChild('reviewedBySelect') reviewedBySelect!: CustomSelectComponent;
  @ViewChild('inspectionBySelect') inspectionBySelect!: CustomSelectComponent;

  // Configuración de API para usuarios (se actualizará con datos del modal)
  collaboratorApiConfig: any = {
    endpoint: '/ws/UsuarioSvcImpl.php',
    requestBody: {
      caso: 'ConsultaUsuariosObra',
      idObra: 1,
      idUsuario: 0,
    },
    valueKey: 'IdUsuario',
    labelKey: 'nombre',
  };

  // Mantengo el objeto original para compatibilidad
  usuariosObraRequestBody = this.collaboratorApiConfig.requestBody;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CheckListModalComponent>,
    private dateAdapter: DateAdapter<Date>,
    private proxyService: ProxyService,
    private fileService: FileService,
    private dialog: MatDialog,
    private elementRef: ElementRef,

    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Inicializar el formulario
    const defaultDate = this.formatDate(new Date('2025-04-22')); // Formatear como string YYYY-MM-DD
    this.name = this.data?.name || '';
    this.checkListForm = this.fb.group({
      inspectedBy: ['', Validators.required],
      inspectionDate: [defaultDate, Validators.required], // Usar string ya formateado
      inspectionDate2: [defaultDate, Validators.required], // Usar string ya formateado
      inspectionTime: ['12:00', Validators.required],
      reviewedBy: ['', Validators.required],
      reviewerPosition: ['', Validators.required],
      reviewDate: [defaultDate, Validators.required], // Usar string ya formateado
      reviewTime: ['12:00', Validators.required],
      checkItems: this.fb.array([]),
      observations: [''],
    });

    // Configurar el formato de fecha en español
    this.dateAdapter.setLocale('es');

    // Actualizar la configuración de API con los datos pasados desde el modal
    if (this.data?.collaboratorApiConfig) {
      this.collaboratorApiConfig = this.data.collaboratorApiConfig;
      this.usuariosObraRequestBody = this.collaboratorApiConfig.requestBody;
      console.log(
        'Configuración de colaboradores actualizada:',
        this.collaboratorApiConfig
      );
    } else if (this.data?.projectId) {
      // Fallback: actualizar solo el ID del proyecto
      this.usuariosObraRequestBody.idObra = parseInt(this.data.projectId);
      console.log(
        'ID de obra actualizado en usuariosObraRequestBody:',
        this.usuariosObraRequestBody.idObra
      );
    }

    // Almacenar el ID del colaborador para establecerlo después de que se carguen las opciones
    if (this.data?.selectedCollaboratorId) {
      this.defaultCollaboratorId = this.data.selectedCollaboratorId;
      this.defaultCollaboratorName = this.data.selectedCollaboratorName;
      console.log(
        'Colaborador por defecto almacenado para configuración posterior:',
        this.data.selectedCollaboratorName,
        'ID:',
        this.data.selectedCollaboratorId
      );
    }

    // Inicializar elementos del check list
    this.loadDefaultData();
  }

  ngOnInit(): void {
    // Configurar el formato de fecha
    this.dateAdapter.setLocale('es');

    // Cargar datos iniciales
    this.loadDefaultData();

    // Mostrar los datos recibidos por el modal para depuración
    console.log('Datos recibidos por el modal:', this.data);
    console.log(
      'DEBUG IDPARAM - Valor específico recibido:',
      this.data?.idParam,
      'Tipo:',
      typeof this.data?.idParam
    );

    // Cargar los elementos del checklist
    if (this.data?.idTrabajoAltura || this.data?.idControl) {
      // Si tenemos idControl y dia, o idTrabajoAltura, cargar desde API
      this.loadCheckListData(this.data?.idTrabajoAltura || '');
    } else {
      console.warn(
        'No se proporcionaron parámetros para cargar datos del checklist'
      );
      // Si no hay parámetros, cargar elementos de muestra
      this.loadCheckListItems();
    }
  }

  ngAfterViewInit(): void {
    // Acciones después de que la vista se inicializa
    setTimeout(() => {
      // Establecer valores iniciales si es necesario
      if (this.data?.reviewedBy) {
        this.reviewedByControl.setValue(this.data.reviewedBy);
      }
    });
  }

  // Getter para acceder a los elementos del FormArray
  get checkItemsControls(): FormGroup[] {
    return (this.checkListForm.get('checkItems') as FormArray)
      .controls as FormGroup[];
  }

  // Actualizar checkboxes (solo permite seleccionar uno por fila)
  updateCheckboxes(index: number, field: 'yes' | 'no' | 'na'): void {
    const itemForm = (this.checkListForm.get('checkItems') as FormArray).at(
      index
    ) as FormGroup;

    // Desmarcar las otras casillas
    if (field === 'yes') {
      itemForm.get('no')?.setValue(false);
      itemForm.get('na')?.setValue(false);
    } else if (field === 'no') {
      itemForm.get('yes')?.setValue(false);
      itemForm.get('na')?.setValue(false);
    } else if (field === 'na') {
      itemForm.get('yes')?.setValue(false);
      itemForm.get('no')?.setValue(false);
    }

    // Actualizar la fecha al marcar una casilla con el formato correcto (como string)
    const fechaActual = this.formatDate(new Date());
    itemForm.get('date')?.setValue(fechaActual);
  }

  // Cargar los elementos del checklist
  loadCheckListItems(items?: CheckListItem[]): void {
    const itemsArray = this.checkListForm.get('checkItems') as FormArray;

    // Limpiar elementos existentes
    while (itemsArray.length) {
      itemsArray.removeAt(0);
    }

    // Si recibimos items, agregarlos al FormArray
    if (items && items.length > 0) {
      items.forEach((item) => {
        itemsArray.push(
          this.fb.group({
            id: [item.id],
            description: [item.description],
            yes: [item.yes],
            no: [item.no],
            na: [item.na],
            date: [item.date],
          })
        );
      });
      console.log(`Se agregaron ${items.length} elementos al formulario`);
    } else {
      console.warn('No se proporcionaron elementos para agregar al checklist');
    }
  }

  // Cargar datos del checklist desde la API
  loadCheckListData(id: string): void {
    this.isLoading = true;
    this.errorLoading = '';

    // Obtener los parámetros necesarios de los datos pasados al modal
    const idControl = this.data?.idControl || 0;
    const dia = this.data?.day || 0;

    // Primero: Consultar el idTrabajoAltura usando el endpoint con caso "Consulta"
    const consultaTrabajoAlturaBody = {
      caso: 'Consulta',
      idTrabajoAltura: 0,
      idControl: idControl,
      dia: dia,
      idArea: 0,
      fecha: '0001-01-01T00:00:00',
      idRealizadoPor: 0,
      idRealizadoPorCargo: 0,
      RealizadoPorfecha: '0001-01-01T00:00:00',
      idRevisadoPor: 0,
      idRevisadoPorCargo: 0,
      RevisadoPorFecha: '0001-01-01T00:00:00',
      observaciones: null,
      idSubParametro: 0,
      idInspeccionadoPor: 0,
    };

    console.log('Consultando idTrabajoAltura:', consultaTrabajoAlturaBody);

    // Realizar la consulta para obtener el idTrabajoAltura
    this.proxyService
      .post<any>(
        environment.apiBaseUrl + '/ws/TrabajoAlturaSvcImpl.php',
        consultaTrabajoAlturaBody
      )
      .pipe(
        catchError((error) => {
          console.error('Error al consultar idTrabajoAltura:', error);
          this.errorLoading = 'Error al cargar los datos. Intente nuevamente.';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe((trabajoAlturaResponse) => {
        console.log('Respuesta Consulta TrabajoAltura:', trabajoAlturaResponse);
        // Si tenemos una respuesta exitosa y hay datos
        if (
          trabajoAlturaResponse &&
          trabajoAlturaResponse.success &&
          trabajoAlturaResponse.data &&
          trabajoAlturaResponse.data.length > 0
        ) {
          // Guardar el idTrabajoAltura en los datos del componente
          const responseData = trabajoAlturaResponse.data[0];
          const idTrabajoAltura = responseData.idTrabajoAltura;
          console.log('idTrabajoAltura obtenido:', idTrabajoAltura);

          // Actualizar los datos del componente con el idTrabajoAltura
          if (this.data) {
            this.data.idTrabajoAltura = idTrabajoAltura;
          } else {
            this.data = { idTrabajoAltura };
          }

          // Extraer las fechas de la respuesta API
          const inspectionDate = responseData.fecha;
          const reviewDate = responseData.RevisadoPorFecha;

          console.log(
            'Fechas obtenidas - Inspección:',
            inspectionDate,
            'Revisión:',
            reviewDate
          );

          // Actualizar los campos de fecha en el formulario
          if (inspectionDate && inspectionDate !== '0001-01-01') {
            // Convertir string a objeto Date para el datepicker
            const inspDate = new Date(inspectionDate);
            this.checkListForm.get('inspectionDate2')?.setValue(inspDate);
            console.log('Fecha de inspección establecida:', inspDate);
          }

          if (reviewDate && reviewDate !== '0001-01-01') {
            // Convertir string a objeto Date para el datepicker
            const revDate = new Date(reviewDate);
            this.checkListForm.get('reviewDate')?.setValue(revDate);
            console.log('Fecha de revisión establecida:', revDate);

            // Si hay fecha de revisión, marcar como revisado
            this.isReviewed = true;
          }

          // Ahora procedemos a cargar los elementos del checklist
          this.loadCheckListElements(idControl, dia);
        } else {
          console.error(
            'No se pudo obtener idTrabajoAltura:',
            trabajoAlturaResponse
          );
          this.errorLoading =
            'No se pudo obtener la información del trabajo en altura.';
          this.isLoading = false;
        }
      });
  }

  // Método separado para cargar los elementos del checklist una vez tenemos el idTrabajoAltura
  private loadCheckListElements(
    idControl: number | string,
    dia: number | string
  ): void {
    // Cuerpo de solicitud para la API de ConsultaDetalle
    const consultaDetalleBody = {
      caso: 'ConsultaDetalle',
      idTrabajoAltura: this.data?.idTrabajoAltura || 0,
      idControl: idControl,
      dia: dia,
      idArea: 0,
      fecha: '0001-01-01T00:00:00',
      idRealizadoPor: 0,
      idRealizadoPorCargo: 0,
      RealizadoPorfecha: '0001-01-01T00:00:00',
      idRevisadoPor: 0,
      idRevisadoPorCargo: 0,
      RevisadoPorFecha: '0001-01-01T00:00:00',
      observaciones: null,
      idSubParametro: this.data?.idParam ? Number(this.data.idParam) : 0,
      idInspeccionadoPor: 0,
    };

    console.log('Consultando elementos a inspeccionar:', consultaDetalleBody);

    this.proxyService
      .post<ConsultaDetalleResponse>(
        environment.apiBaseUrl + '/ws/TrabajoAlturaSvcImpl.php',
        consultaDetalleBody
      )
      .pipe(
        catchError((error) => {
          console.error('Error al cargar elementos del checklist:', error);
          this.errorLoading =
            'Error al cargar los elementos. Intente nuevamente.';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe((response) => {
        console.log('Respuesta ConsultaDetalle:', response);

        if (
          response &&
          response.success &&
          response.code === 200 &&
          response.data &&
          response.data.length > 0
        ) {
          // Crear items de checklist con los datos de la API
          const elementos = response.data;
          const checklistItems: CheckListItem[] = elementos.map((elemento) => ({
            id: parseInt(elemento.idElementoInspeccionar),
            description: elemento.elementoInspeccionar, // Usa elementoInspeccionar en lugar de descripcion
            yes: false,
            no: false,
            na: false,
            date: '',
          }));

          console.log('Items de checklist creados:', checklistItems);

          // Cargar los items en el formulario pasando los items creados
          this.loadCheckListItems(checklistItems);

          // Cargar los valores de los checks (si/no/na) para cada elemento usando el idTrabajoAltura obtenido
          this.loadCheckValues(this.data?.idTrabajoAltura || '');
        } else {
          this.errorLoading =
            'No se pudieron cargar los elementos a inspeccionar';
          this.isLoading = false;
          console.error('Error en la respuesta:', response);
        }
      });
  }

  // Cargar los valores de los checks (si/no/na) desde la API
  loadCheckValues(idTrabajoAltura: string): void {
    if (!idTrabajoAltura || idTrabajoAltura === '') {
      console.warn('ID de trabajo altura no proporcionado');
      this.isLoading = false;
      return;
    }

    const consultaListaBody = {
      caso: 'ConsultaLista',
      idTrabajoAlturaDetalle: 0,
      idTrabajoAltura: idTrabajoAltura ? parseInt(idTrabajoAltura) : 0,
      idElementoInspeccionar: 0,
      elementoInspeccionar: null,
      si: false,
      no: false,
      na: false,
      idResponsable: 0,
      fecha: '0001-01-01T00:00:00',
    };

    console.log('Consultando valores de checks:', consultaListaBody);

    this.proxyService
      .post<ConsultaListaResponse>(
        environment.apiBaseUrl + '/ws/TrabajoAlturaSvcImpl.php',
        consultaListaBody
      )
      .pipe(
        finalize(() => (this.isLoading = false)),
        catchError((error) => {
          console.error('Error al cargar valores de checks:', error);
          this.errorLoading =
            'Error al cargar los valores seleccionados. Intente nuevamente.';
          return of(null);
        })
      )
      .subscribe((response) => {
        console.log('Respuesta ConsultaLista:', response);

        if (
          response &&
          response.success &&
          response.code === 200 &&
          response.data &&
          response.data.length > 0
        ) {
          const respuestas = response.data;
          console.log('Valores de checks obtenidos:', respuestas);

          // Actualizar los valores de los checks en el formulario según el idElementoInspeccionar
          const checkItemsArray = this.checkListForm.get(
            'checkItems'
          ) as FormArray;

          // Para cada respuesta, buscar el control correspondiente y actualizar sus valores
          respuestas.forEach((respuesta) => {
            const idElemento = parseInt(respuesta.idElementoInspeccionar);

            // Buscar el índice del elemento en el FormArray
            for (let i = 0; i < checkItemsArray.length; i++) {
              const itemGroup = checkItemsArray.at(i) as FormGroup;
              if (itemGroup.get('id')?.value === idElemento) {
                console.log(`Actualizando elemento ${idElemento}:`, respuesta);

                // Actualizar los valores según la respuesta de la API
                itemGroup.get('yes')?.setValue(respuesta.si === '1');
                itemGroup.get('no')?.setValue(respuesta.no === '1');
                itemGroup.get('na')?.setValue(respuesta.na === '1');

                // Actualizar la fecha si está disponible
                if (
                  respuesta.fecha &&
                  respuesta.fecha !== '0001-01-01T00:00:00'
                ) {
                  try {
                    // Actualizamos el valor de la fecha en el formulario como un string formateado
                    const fechaObj = new Date(respuesta.fecha);
                    // Verificamos que la fecha sea válida
                    if (!isNaN(fechaObj.getTime())) {
                      const fechaFormateada = this.formatDate(fechaObj);
                      itemGroup.get('date')?.setValue(fechaFormateada);
                    } else {
                      console.warn(
                        'Fecha inválida recibida de la API:',
                        respuesta.fecha
                      );
                      itemGroup.get('date')?.setValue('');
                    }
                  } catch (err) {
                    console.error('Error al procesar la fecha:', err);
                    itemGroup.get('date')?.setValue('');
                  }
                } else {
                  // Si no hay fecha o es la fecha por defecto, establecer string vacío
                  itemGroup.get('date')?.setValue('');
                }
                break; // Ya encontramos el elemento, salimos del bucle
              }
            }
          });
        } else {
          console.log(
            'No se encontraron valores de checks o hubo un error en la respuesta'
          );
        }
      });
  }

  // Método para cargar datos iniciales y configuraciones por defecto
  loadDefaultData(): void {
    // Vincular el control de revisado con el formulario
    this.reviewedByControl.valueChanges.subscribe((value) => {
      this.checkListForm.get('reviewedBy')?.setValue(value);
    });

    // Vincular el control de inspeccionado con el formulario
    this.inspectionByControl.valueChanges.subscribe((value) => {
      this.checkListForm.get('inspectedBy')?.setValue(value);
    });
  }

  // Métodos para manejar la carga de opciones de usuarios
  onInspectionOptionsLoaded(options: any[]): void {
    console.log('Opciones de inspección cargadas:', options);
    if (this.defaultCollaboratorId && options.length > 0) {
      // Buscar si el colaborador por defecto existe en las opciones
      const defaultOption = options.find(
        (option) => option.value === this.defaultCollaboratorId
      );
      if (defaultOption) {
        console.log(
          'Estableciendo colaborador por defecto para inspección:',
          defaultOption.label
        );
        this.inspectionByControl.setValue(this.defaultCollaboratorId);
      } else {
        console.log(
          'Colaborador por defecto no encontrado en opciones de inspección, ID:',
          this.defaultCollaboratorId
        );
        console.log(
          'Opciones disponibles:',
          options.map((o) => ({ id: o.value, name: o.label }))
        );
      }
    }
  }

  onReviewOptionsLoaded(options: any[]): void {
    console.log('Opciones de revisión cargadas:', options);
    if (this.defaultCollaboratorId && options.length > 0) {
      // Buscar si el colaborador por defecto existe en las opciones
      const defaultOption = options.find(
        (option) => option.value === this.defaultCollaboratorId
      );
      if (defaultOption) {
        console.log(
          'Estableciendo colaborador por defecto para revisión:',
          defaultOption.label
        );
        this.reviewedByControl.setValue(this.defaultCollaboratorId);
      } else {
        console.log(
          'Colaborador por defecto no encontrado en opciones de revisión, ID:',
          this.defaultCollaboratorId
        );
        console.log(
          'Opciones disponibles:',
          options.map((o) => ({ id: o.value, name: o.label }))
        );
      }
    }
  }

  // Método auxiliar para formatear fechas consistentemente
  private formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }

  // Método auxiliar para marcar todos los campos del formulario como tocados (para validación)
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((ctrl) => {
          if (ctrl instanceof FormGroup) {
            this.markFormGroupTouched(ctrl);
          } else {
            ctrl.markAsTouched();
          }
        });
      }
    });
  }

  // Acciones de los botones
  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.checkListForm.valid) {
      console.log(
        'Formulario válido, enviando datos:',
        this.checkListForm.value
      );

      // Preparar datos para guardar
      const checkItems = (
        this.checkListForm.get('checkItems') as FormArray
      ).controls.map((control: AbstractControl) => {
        const group = control as FormGroup;
        return {
          idElementoInspeccionar: group.get('id')?.value,
          si: group.get('yes')?.value ? '1' : '0',
          no: group.get('no')?.value ? '1' : '0',
          na: group.get('na')?.value ? '1' : '0',
          fecha: group.get('date')?.value || '',
          idResponsable: this.checkListForm.get('inspectedBy')?.value || '0',
        };
      });

      // Aquí se implementaría la llamada para guardar los datos
      // Por ahora solo cerramos el modal con los datos
      this.dialogRef.close({
        ...this.checkListForm.value,
        checkItems: checkItems,
        idTrabajoAltura: this.data?.idTrabajoAltura || '',
        idControl: this.data?.idControl || '',
      });
    } else {
      // Marcar todos los controles como tocados para mostrar errores
      this.markFormGroupTouched(this.checkListForm);
    }
  }

  // onExportToPdf(): void {
  //   console.log('Exportando a PDF...');
  //   //const htmlContent = '<h1>Checklist</h1>';
  //   const htmlContent =
  //     '<h1>Checklist</h1><p>Este es un checklist</p><p>Fecha: ' +
  //     this.checkListForm.get('inspectionDate2')?.value +
  //     '</p><p>Hora: ' +
  //     this.checkListForm.get('inspectionTime')?.value +
  //     '</p><p>Inspeccionada por: ' +
  //     this.checkListForm.get('inspectedBy')?.value +
  //     '</p><p>Revisada por: ' +
  //     this.checkListForm.get('reviewedBy')?.value +
  //     '</p><p>Observaciones: ' +
  //     this.checkListForm.get('observations')?.value +
  //     '</p><p>Nombre: ' +
  //     this.name +
  //     '</p><p>Adjuntos:</p><p>Revisado: ' +
  //     this.isReviewed +
  //     '</p><p>Fecha de revisión: ' +
  //     this.checkListForm.get('reviewDate')?.value +
  //     '</p><p>Hora de revisión: ' +
  //     this.checkListForm.get('reviewTime')?.value +
  //     '</p><p>Fecha de inspección: ' +
  //     this.checkListForm.get('inspectionDate2')?.value +
  //     '</p><p>Hora de inspección: ' +
  //     this.checkListForm.get('inspectionTime')?.value +
  //     '</p>';
  //   this.fileService
  //     .htmlToPdf(htmlContent, 'checklist.pdf', 'Checklist', 'V')
  //     .subscribe(
  //       (response) => {
  //         console.log('PDF generado exitosamente:', response);
  //         const externalUrl = response.url;
  //         const dialogRef = this.dialog.open(ModalFileComponent, {
  //           width: '90vw',
  //           height: '90vh',
  //           maxWidth: '1200px',
  //           maxHeight: '800px',
  //           panelClass: 'pdf-dialog',
  //           autoFocus: true,
  //           restoreFocus: true,
  //           disableClose: false,
  //           hasBackdrop: true,
  //           data: {
  //             documentUrl: externalUrl,
  //             filename: 'checklist.pdf',
  //           },
  //         });
  //       },
  //       (error) => {
  //         console.error('Error al generar PDF:', error);
  //       }
  //     );
  // }

  printAsPdf() {
    // 1. Obtener el elemento del shadow DOM
    const shadowRoot = this.elementRef.nativeElement;

    // 2. Extraer los estilos del shadow DOM
    let styles = '';
    // const styleSheets = Array.from(shadowRoot.adoptedStyleSheets || []);

    // 3. Obtener los estilos inline que Angular inyecta
    const styleElements = shadowRoot.querySelectorAll('style');
    styleElements.forEach((style: { textContent: string; }) => {
      styles += style.textContent;
    });

    // 4. Obtener HTML del contenido
    const contentHtml = shadowRoot.querySelector(
      '.check-list-dialog-content'
    ).innerHTML;

    // 5. Combinar todo en un HTML completo
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${styles}
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;

    // 6. Generar PDF
    this.fileService.htmlToPdf(fullHtml, 'checklist.pdf', 'Checklist', 'V').subscribe(
      (response) => {
        console.log('PDF generado exitosamente:', response);
        const externalUrl = response.url;
        const dialogRef = this.dialog.open(ModalFileComponent, {
          width: '90vw',
          height: '90vh',
          maxWidth: '1200px',
          maxHeight: '800px',
          panelClass: 'pdf-dialog',
          autoFocus: true,
          restoreFocus: true,
          disableClose: false,
          hasBackdrop: true,
          data: {
            documentUrl: externalUrl,
            filename: 'checklist.pdf',
          },
        });
      },
      (error) => {
        console.error('Error al generar PDF:', error);
      }
    );
  }
}
