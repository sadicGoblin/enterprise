import { Component, OnInit, Inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomSelectComponent } from '../../../../../../shared/controls/custom-select/custom-select.component';
import { ProxyService } from '../../../../../../core/services/proxy.service';
import { Observable, catchError, finalize, of } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';

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
    CustomSelectComponent
  ],
  templateUrl: './checklist-modal.component.html',
  styleUrl: './checklist-modal.component.scss'
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
  
  @ViewChild(CustomSelectComponent) reviewedBySelect!: CustomSelectComponent;

  // Objeto de solicitud para cargar usuarios por obra
  usuariosObraRequestBody = {
    caso: 'ConsultaUsuariosObra',
    idObra: 1, // ID predeterminado, actualizar según sea necesario
    idUsuario: 0
  };
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CheckListModalComponent>,
    private dateAdapter: DateAdapter<Date>,
    private proxyService: ProxyService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Inicializar el formulario
    const defaultDate = this.formatDate(new Date('2025-04-22')); // Formatear como string YYYY-MM-DD

    this.checkListForm = this.fb.group({
      inspectedBy: [defaultDate, Validators.required],
      inspectionDate: [defaultDate, Validators.required], // Usar string ya formateado
      inspectionDate2: [defaultDate, Validators.required], // Usar string ya formateado
      inspectionTime: ['12:00', Validators.required],
      reviewedBy: ['', Validators.required],
      reviewerPosition: ['', Validators.required],
      reviewDate: [defaultDate, Validators.required], // Usar string ya formateado
      reviewTime: ['12:00', Validators.required],
      checkItems: this.fb.array([]),
      observations: ['']
    });
    
    // Configurar el formato de fecha en español
    this.dateAdapter.setLocale('es');
    
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
    console.log('DEBUG IDPARAM - Valor específico recibido:', this.data?.idParam, 'Tipo:', typeof this.data?.idParam);
    
    // Cargar los elementos del checklist
    if (this.data?.idTrabajoAltura || this.data?.idControl) {
      // Si tenemos idControl y dia, o idTrabajoAltura, cargar desde API
      this.loadCheckListData(this.data?.idTrabajoAltura || '');
    } else {
      console.warn('No se proporcionaron parámetros para cargar datos del checklist');
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
    return (this.checkListForm.get('checkItems') as FormArray).controls as FormGroup[];
  }

  // Actualizar checkboxes (solo permite seleccionar uno por fila)
  updateCheckboxes(index: number, field: 'yes' | 'no' | 'na'): void {
    const itemForm = (this.checkListForm.get('checkItems') as FormArray).at(index) as FormGroup;
    
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
      items.forEach(item => {
        itemsArray.push(this.fb.group({
          id: [item.id],
          description: [item.description],
          yes: [item.yes],
          no: [item.no],
          na: [item.na],
          date: [item.date]
        }));
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
    const dia = this.data?.dia || 0;
    
    // Cuerpo de solicitud para la API de ConsultaDetalle
    const consultaDetalleBody = {
      "caso": "ConsultaDetalle",
      "idTrabajoAltura": 0,
      "idControl": idControl,
      "dia": dia,
      "idArea": 0,
      "fecha": "0001-01-01T00:00:00",
      "idRealizadoPor": 0,
      "idRealizadoPorCargo": 0,
      "RealizadoPorfecha": "0001-01-01T00:00:00",
      "idRevisadoPor": 0,
      "idRevisadoPorCargo": 0,
      "RevisadoPorFecha": "0001-01-01T00:00:00",
      "observaciones": null,
      "idSubParametro": this.data?.idParam ? Number(this.data.idParam) : 0,
      // Depuración de idParam
      // "idSubParametroRaw": this.data?.idParam || 'no-idParam',
      "idInspeccionadoPor": 0
    };
    
    console.log('Consultando elementos a inspeccionar:', consultaDetalleBody);
    
    // Primer paso: cargar los elementos a inspeccionar
    this.proxyService.post<ConsultaDetalleResponse>(environment.apiBaseUrl + '/ws/TrabajoAlturaSvcImpl.php', consultaDetalleBody)
      .pipe(
        catchError(error => {
          console.error('Error al cargar elementos del checklist:', error);
          this.errorLoading = 'Error al cargar los elementos. Intente nuevamente.';
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe(response => {
        console.log('Respuesta ConsultaDetalle:', response);
        
        if (response && response.success && response.code === 200 && response.data && response.data.length > 0) {
          // Crear items de checklist con los datos de la API
          const elementos = response.data;
          const checklistItems: CheckListItem[] = elementos.map(elemento => ({
            id: parseInt(elemento.idElementoInspeccionar),
            description: elemento.elementoInspeccionar, // Usa elementoInspeccionar en lugar de descripcion
            yes: false,
            no: false,
            na: false,
            date: ''
          }));
          
          console.log('Items de checklist creados:', checklistItems);
          
          // Cargar los items en el formulario pasando los items creados
          this.loadCheckListItems(checklistItems);
          
          // Segundo paso: cargar los valores de los checks (si/no/na) para cada elemento
          // Pasamos el id de trabajo en altura que viene de los datos del modal
          // this.loadCheckValues(this.data?.idTrabajoAltura || '');
          this.loadCheckValues("11118");

        } else {
          this.errorLoading = 'No se pudieron cargar los elementos a inspeccionar';
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
      "caso": "ConsultaLista",
      "idTrabajoAlturaDetalle": 0,
      "idTrabajoAltura": idTrabajoAltura ? parseInt(idTrabajoAltura) : 0,
      "idElementoInspeccionar": 0,
      "elementoInspeccionar": null,
      "si": false,
      "no": false,
      "na": false,
      "idResponsable": 0,
      "fecha": "0001-01-01T00:00:00"
    };
    
    console.log('Consultando valores de checks:', consultaListaBody);
    
    this.proxyService.post<ConsultaListaResponse>(environment.apiBaseUrl + '/ws/TrabajoAlturaSvcImpl.php', consultaListaBody)
      .pipe(
        finalize(() => this.isLoading = false),
        catchError(error => {
          console.error('Error al cargar valores de checks:', error);
          this.errorLoading = 'Error al cargar los valores seleccionados. Intente nuevamente.';
          return of(null);
        })
      )
      .subscribe(response => {
        console.log('Respuesta ConsultaLista:', response);
        
        if (response && response.success && response.code === 200 && response.data && response.data.length > 0) {
          const respuestas = response.data;
          console.log('Valores de checks obtenidos:', respuestas);
          
          // Actualizar los valores de los checks en el formulario según el idElementoInspeccionar
          const checkItemsArray = this.checkListForm.get('checkItems') as FormArray;
          
          // Para cada respuesta, buscar el control correspondiente y actualizar sus valores
          respuestas.forEach(respuesta => {
            const idElemento = parseInt(respuesta.idElementoInspeccionar);
            
            // Buscar el índice del elemento en el FormArray
            for (let i = 0; i < checkItemsArray.length; i++) {
              const itemGroup = checkItemsArray.at(i) as FormGroup;
              if (itemGroup.get('id')?.value === idElemento) {
                console.log(`Actualizando elemento ${idElemento}:`, respuesta);
                
                // Actualizar los valores según la respuesta de la API
                itemGroup.get('yes')?.setValue(respuesta.si === "1");
                itemGroup.get('no')?.setValue(respuesta.no === "1");
                itemGroup.get('na')?.setValue(respuesta.na === "1");
                
                // Actualizar la fecha si está disponible
                if (respuesta.fecha && respuesta.fecha !== "0001-01-01T00:00:00") {
                  try {
                    // Actualizamos el valor de la fecha en el formulario como un string formateado
                    const fechaObj = new Date(respuesta.fecha);
                    // Verificamos que la fecha sea válida
                    if (!isNaN(fechaObj.getTime())) {
                      const fechaFormateada = this.formatDate(fechaObj);
                      itemGroup.get('date')?.setValue(fechaFormateada);
                    } else {
                      console.warn('Fecha inválida recibida de la API:', respuesta.fecha);
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
          console.log('No se encontraron valores de checks o hubo un error en la respuesta');
        }
      });
  }

  // Método para cargar datos iniciales y configuraciones por defecto
  loadDefaultData(): void {
    // Vincular el control de revisado con el formulario
    this.reviewedByControl.valueChanges.subscribe(value => {
      this.checkListForm.get('reviewedBy')?.setValue(value);
    });
    
    // Vincular el control de inspeccionado con el formulario
    this.inspectionByControl.valueChanges.subscribe(value => {
      this.checkListForm.get('inspectedBy')?.setValue(value);
    });
  }
  
  // Método auxiliar para formatear fechas consistentemente
  private formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }
  
  // Método auxiliar para marcar todos los campos del formulario como tocados (para validación)
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(ctrl => {
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

  /**
   * Genera un PDF con los datos del checklist
   */
  saveAsPDF(): void {
    // Crear el contenido HTML para el PDF
    const reportTitle = 'CHECK LIST BODEGA DE GASES';
    const projectName = this.data.projectName || 'Proyecto';
    const currentDate = new Date().toLocaleDateString('es-CL');
    
    // Obtener los datos del formulario
    const formData = this.checkListForm.value;
    const inspectionDate = formData.inspectionDate2 ? new Date(formData.inspectionDate2).toLocaleDateString('es-CL') : 'No disponible';
    const inspectionTime = formData.inspectionTime || '';
    const inspectedBy = this.inspectionByControl.value || 'No especificado';
    const reviewDate = formData.reviewDate ? new Date(formData.reviewDate).toLocaleDateString('es-CL') : 'No disponible';
    const reviewTime = formData.reviewTime || '';
    const reviewedBy = this.reviewedByControl.value || 'No especificado';
    const observations = formData.observations || 'No hay observaciones';
    
    // Crear el contenido HTML para el PDF
    let reportHtml = `
      <div class="pdf-container" style="font-family: Arial, sans-serif; padding: 20px;">
        <div class="pdf-header" style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #0066cc; font-size: 20px;">ZONAS COMUNES :: ${reportTitle}</h1>
          <p style="margin: 5px 0;">Proyecto: ${projectName}</p>
          <p style="margin: 5px 0;">Fecha de emisión: ${currentDate}</p>
        </div>

        <div class="pdf-info" style="margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; width: 50%;"><strong>Fecha inspección:</strong> ${inspectionDate}</td>
              <td style="padding: 5px;"><strong>Hora:</strong> ${inspectionTime}</td>
            </tr>
            <tr>
              <td style="padding: 5px;"><strong>Inspeccionado por:</strong> ${inspectedBy}</td>
              <td style="padding: 5px;"><strong>Revisado por:</strong> ${reviewedBy}</td>
            </tr>
            <tr>
              <td style="padding: 5px;"><strong>Fecha revisión:</strong> ${reviewDate}</td>
              <td style="padding: 5px;"><strong>Hora revisión:</strong> ${reviewTime}</td>
            </tr>
          </table>
        </div>
    `;
    
    // Añadir tabla de items de checklist si hay datos
    if (this.checkItemsControls.length > 0) {
      reportHtml += `
        <div class="pdf-items" style="margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333; font-size: 16px;">Elementos inspeccionados</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Elemento a inspeccionar</th>
                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">Si</th>
                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">No</th>
                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">N.A.</th>
                <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">Fecha</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Agregar filas de datos
      this.checkItemsControls.forEach((item, index) => {
        const itemValue = item.value;
        reportHtml += `
          <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
            <td style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">${itemValue.description || 'No disponible'}</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${itemValue.yes ? '✓' : ''}</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${itemValue.no ? '✓' : ''}</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${itemValue.na ? '✓' : ''}</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${itemValue.date || 'No disponible'}</td>
          </tr>
        `;
      });
      
      reportHtml += `
            </tbody>
          </table>
        </div>
      `;
    }
    
    // Añadir observaciones
    reportHtml += `
      <div class="pdf-observations" style="margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Observaciones</h3>
        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px; background-color: #f9f9f9;">
          ${observations}
        </div>
      </div>
    `;
    
    // Cerrar el contenedor principal
    reportHtml += `
      <div class="pdf-footer" style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
        <p>Este documento fue generado automáticamente por el sistema.</p>
        <p>© ${new Date().getFullYear()} SSTMA - Todos los derechos reservados.</p>
      </div>
    </div>`;
    
    // Crear un elemento temporal para generar el PDF
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Check List - Bodega de Gases</title>
        <style>
          @media print {
            body { font-family: Arial, sans-serif; }
            @page { size: A4; margin: 2cm; }
          }
        </style>
      </head>
      <body>
        ${reportHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow?.document.close();
  }

  onSave(): void {
    if (this.checkListForm.valid) {
      console.log('Formulario válido, enviando datos:', this.checkListForm.value);
      
      // Preparar datos para guardar
      const checkItems = (this.checkListForm.get('checkItems') as FormArray).controls.map(
        (control: AbstractControl) => {
          const group = control as FormGroup;
          return {
            idElementoInspeccionar: group.get('id')?.value,
            si: group.get('yes')?.value ? "1" : "0",
            no: group.get('no')?.value ? "1" : "0",
            na: group.get('na')?.value ? "1" : "0",
            fecha: group.get('date')?.value || '',
            idResponsable: this.checkListForm.get('inspectedBy')?.value || '0'
          };
        }
      );
      
      // Aquí se implementaría la llamada para guardar los datos
      // Por ahora solo cerramos el modal con los datos
      this.dialogRef.close({
        ...this.checkListForm.value,
        checkItems: checkItems,
        idTrabajoAltura: this.data?.idTrabajoAltura || '',
        idControl: this.data?.idControl || ''
      });
    } else {
      // Marcar todos los controles como tocados para mostrar errores
      this.markFormGroupTouched(this.checkListForm);
    }
  }
}
