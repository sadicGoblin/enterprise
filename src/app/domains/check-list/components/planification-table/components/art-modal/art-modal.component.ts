import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
} from '@angular/core';
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
  
  constructor(
    private dialogRef: MatDialogRef<ArtModalComponent>,
    private dialog: MatDialog
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
   * Muestra un diálogo de éxito y cierra el modal
   */
  showSuccessDialog(): void {
    const dialogData: ConfirmDialogData = {
      title: 'Operación exitosa',
      message: 'ART guardado correctamente',
      confirmText: 'Aceptar',
      cancelText: ''
    };
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe(() => {
      this.dialogRef.close(true);
    });
  }
  
  saveArt(): void {
    // Validar todos los formularios antes de guardar
    if (this.validateAllForms()) {
      // Aquí se implementará la lógica para guardar todos los datos del ART
      console.log('Guardando datos del ART...');
      
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
                      this.artValidationComponent.generalAttachmentFile.name : null
          }
        }
      };
      
      // Combinar todos los datos
      const artCompleteData = {
        ...formData,
        validation: validationData
      };
      
      console.log('Datos completos del ART:', artCompleteData);
      
      // Mostrar mensaje de éxito y cerrar el diálogo
      this.showSuccessDialog();
    } else {
      // Mostrar diálogo con errores de validación
      this.showValidationErrorsDialog();
    }
  }
}
