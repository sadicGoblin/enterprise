import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ValidationErrorDialogComponent, ValidationErrorDialogData } from '../../../../../../shared/components/validation-error-dialog/validation-error-dialog.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { ArtFormsComponent } from './components/art-forms/art-forms.component';
import { ArtInspectionElementsComponent } from './components/art-inspection-elements/art-inspection-elements.component';
import { ArtItemsSelectionComponent } from './components/art-items-selection/art-items-selection.component';
import { ArtValidationSectionComponent } from './components/art-validation-section/art-validation-section.component';
import { ArtService } from './services/art.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-art-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatDividerModule,
    ArtFormsComponent,
    ArtInspectionElementsComponent,
    ArtItemsSelectionComponent,
    ArtValidationSectionComponent,
  ],
  providers: [ArtService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './art-modal.component.html',
  styleUrls: ['./art-modal.component.scss'],
})
export class ArtModalComponent implements OnInit {
  @ViewChild(ArtFormsComponent) artFormsComponent!: ArtFormsComponent;
  @ViewChild(ArtValidationSectionComponent) artValidationComponent!: ArtValidationSectionComponent;
  
  // Variable para controlar mensajes de error
  validationErrors: string[] = [];
  showValidationErrors = false;
  
  // Estado de guardado
  isSaving = false;
  
  constructor(
    private dialogRef: MatDialogRef<ArtModalComponent>,
    private dialog: MatDialog,
    private artService: ArtService
  ) {}
  
  ngOnInit(): void {
    // Inicialización del componente
  }
  
  /**
   * Valida todos los formularios y muestra errores si es necesario
   * @returns true si todos los formularios son válidos, false en caso contrario
   */
  validateAllForms(): boolean {
    this.validationErrors = [];
    this.showValidationErrors = false;
    
    // Validar formulario de datos generales
    const formsValid = this.artFormsComponent.validateForm();
    if (!formsValid) {
      this.validationErrors.push('Hay campos obligatorios sin completar en la sección "Datos Generales"');
    }
    
    // Validar que al menos una opción de tarea normada esté seleccionada
    const taskSelected = this.artFormsComponent.sstProcedureControl.value || 
                        this.artFormsComponent.sstStandardControl.value || 
                        this.artFormsComponent.operationalProcedureControl.value;
    if (!taskSelected) {
      this.validationErrors.push('Debe seleccionar al menos una tarea normada');
    }
    
    // Validar sección de validación
    const validationSectionValid = this.artValidationComponent.validateForm();
    if (!validationSectionValid) {
      this.validationErrors.push('Hay campos obligatorios sin completar en la sección "Validación"');
    }
    
    // Mostrar errores si existen
    if (this.validationErrors.length > 0) {
      this.showValidationErrors = true;
      return false;
    }
    
    return true;
  }
  
  /**
   * Muestra un diálogo de validación con los errores encontrados
   */
  showValidationErrorsDialog(): void {
    const dialogData: ValidationErrorDialogData = {
      title: 'Por favor, corrija los siguientes errores:',
      errors: this.validationErrors,
      confirmText: 'Aceptar'
    };
    
    this.dialog.open(ValidationErrorDialogComponent, {
      width: '450px',
      data: dialogData,
      disableClose: false,
      panelClass: 'validation-error-dialog'
    });
  }
  
  /**
   * Muestra un diálogo de éxito
   * @param title Título del diálogo
   * @param message Mensaje del diálogo
   */
  showSuccessDialog(title: string = 'ART guardado exitosamente', message: string = 'Los datos del ART han sido guardados correctamente.'): void {
    const dialogData: ConfirmDialogData = {
      title: title,
      message: message,
      confirmText: 'Aceptar',
      cancelText: ''
    };
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: false
    });
    
    dialogRef.afterClosed().subscribe(result => {
      this.dialogRef.close(true);
    });
  }
  
  /**
   * Muestra un diálogo de error
   * @param title Título del diálogo
   * @param message Mensaje del diálogo
   */
  showErrorDialog(title: string, message: string): void {
    const dialogData: ConfirmDialogData = {
      title: title,
      message: message,
      confirmText: 'Aceptar',
      cancelText: ''
    };
    
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: false,
      panelClass: 'error-dialog'
    });
  }
  
  /**
   * Transforma los datos del formulario al formato requerido por la API
   * @param formData Datos del formulario ART
   * @param validationData Datos de validación
   * @returns Objeto en formato API
   */
  transformToApiFormat(formData: any, validationData: any): any {
    // Obtener el mes y año actual para el periodo (YYYYMM)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() devuelve 0-11
    const periodo = year * 100 + month; // Formato YYYYMM
    
    // Determinar el idTareaNormadaPor basado en las selecciones
    let idTareaNormadaPor = 0;
    let tareaNormadaPor = '';
    
    if (formData.sstProcedure) {
      idTareaNormadaPor = 1;
      tareaNormadaPor = 'Proce. SST';
    } else if (formData.sstStandard) {
      idTareaNormadaPor = 2;
      tareaNormadaPor = 'Estandar SST';
    } else if (formData.operationalProcedure) {
      idTareaNormadaPor = 3;
      tareaNormadaPor = 'Proce. Operacional';
    }
    
    // Obtener los datos de equipos de protección, control de riesgo y herramientas
    // Estos datos deberían venir de los componentes de selección de elementos
    // Por ahora usamos valores de ejemplo
    const idsEquipoProteccion = '818;819'; // Ejemplo
    const equipoProteccion = 'MASCARA DE SOLDAR, TAPÓN AUDITIVO'; // Ejemplo
    const idsControlRiesgo = '840;841'; // Ejemplo
    const controlRiesgo = 'CONOS REFLECTANTES, BIOMBOS - MANTAS IGNIFUGAS'; // Ejemplo
    const idsHerramientaEquipo = '851;853'; // Ejemplo
    const herramientaEquipo = 'CARRETILLA, TALADROS'; // Ejemplo
    
    // Formatear la fecha con zona horaria
    const formatDate = (date: Date): string => {
      if (!date) return '';
      
      // Formatear como ISO string y luego ajustar para incluir la zona horaria -04:00
      const isoString = new Date(date).toISOString();
      return isoString.replace('Z', '-04:00');
    };
    
    // Crear el objeto en formato API
    return {
      "caso": "Crea",
      "idControl": -1,
      "periodo": periodo,
      "dia": 0,
      "idART": 0,
      "idTrabajoActividad": 0,
      "trabajoActividad": formData.activity,
      "unidadContratista": formData.contractor,
      "idEspecialidad": 0,
      "Especialidad": formData.specialty,
      "SupervisorCapataz": formData.supervisor,
      "fecha": formatDate(formData.date),
      "idTareaNormadaPor": idTareaNormadaPor,
      "TareaNormadaPor": tareaNormadaPor,
      "nombreDocumento": formData.documentName,
      "codigo": formData.code,
      "idsEquipoProteccion": idsEquipoProteccion,
      "EquipoProteccion": equipoProteccion,
      "idsControlRiesgo": idsControlRiesgo,
      "ControlRiesgo": controlRiesgo,
      "idsHerramientaEquipo": idsHerramientaEquipo,
      "HerramientaEquipo": herramientaEquipo,
      "idRevisadoPor": parseInt(validationData.reviewer.id) || 0,
      "RevisadoPor": this.getNombreUsuario(validationData.reviewer.id) || '',
      "fechaRevisadoPor": formatDate(validationData.reviewer.date),
      "idValidadoPor": parseInt(validationData.validator.id) || 0,
      "ValidadoPor": this.getNombreUsuario(validationData.validator.id) || '',
      "fechaValidadoPor": formatDate(validationData.validator.date),
      "observacionesSSOMA": "", // No tenemos este campo en el formulario actual
      "observaciones": validationData.observations.general.text || "",
      "adjunto": validationData.observations.general.attachment || "",
      "evidencia": "",
      "cargoRevisadoPor": this.getCargoUsuario(validationData.reviewer.id, validationData.reviewer.position) || '',
      "cargoValidadoPor": this.getCargoUsuario(validationData.validator.id, validationData.validator.position) || ''
    };
  }
  
  /**
   * Obtiene el nombre del usuario por su ID
   * @param userId ID del usuario
   * @returns Nombre del usuario
   */
  getNombreUsuario(userId: string): string {
    if (!userId) return '';
    
    // Buscar en la lista de usuarios del componente de validación
    const reviewer = this.artValidationComponent.reviewersList.find(p => p.id === userId);
    if (reviewer) return reviewer.name;
    
    const validator = this.artValidationComponent.validatorsList.find(p => p.id === userId);
    if (validator) return validator.name;
    
    return '';
  }
  
  /**
   * Obtiene el cargo del usuario por su ID y posición
   * @param userId ID del usuario
   * @param positionId ID de la posición
   * @returns Cargo del usuario
   */
  getCargoUsuario(userId: string, positionId: string): string {
    if (!positionId) return '';
    
    // Buscar en la lista de posiciones del componente de validación
    const position = this.artValidationComponent.positionsList.find(p => p.id === positionId);
    if (position) return position.name;
    
    return '';
  }
  
  /**
   * Guarda los datos del ART
   */
  saveArt(): void {
    if (this.validateAllForms()) {
      console.log('Guardando datos del ART...');
      this.isSaving = true;
      
      // Recopilar datos de todos los componentes
      const formData = this.artFormsComponent.artForm.value;
      const validationData = {
        reviewer: {
          id: this.artValidationComponent.reviewerNameControl.value,
          position: this.artValidationComponent.reviewerPositionControl.value,
          date: this.artValidationComponent.reviewerDateControl.value
        },
        validator: {
          id: this.artValidationComponent.validatorNameControl.value,
          position: this.artValidationComponent.validatorPositionControl.value,
          date: this.artValidationComponent.validatorDateControl.value
        },
        observations: {
          general: {
            text: this.artValidationComponent.generalObservationsControl.value,
            attachment: this.artValidationComponent.generalAttachmentFile ? 
                      this.artValidationComponent.generalAttachmentFile.name : ""
          }
        }
      };
      
      // Transformar al formato de API
      const apiData = this.transformToApiFormat(formData, validationData);
      
      console.log('Datos completos del ART:', formData);
      console.log('Datos para API:', apiData);
      
      // Enviar datos a la API
      this.artService.saveArt(apiData)
        .pipe(
          finalize(() => {
            this.isSaving = false;
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Respuesta API:', response);
            if (response.success) {
              this.showSuccessDialog(response.message, `ID ART: ${response.data}`);
            } else {
              this.showErrorDialog('Error al guardar ART', response.message);
            }
          },
          error: (error) => {
            console.error('Error al guardar ART:', error);
            this.showErrorDialog('Error al guardar ART', 'Ha ocurrido un error al comunicarse con el servidor. Por favor, inténtelo nuevamente.');
          }
        });
    } else {
      // Mostrar diálogo con errores de validación
      this.showValidationErrorsDialog();
    }
  }
}
