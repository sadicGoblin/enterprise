import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { CustomSelectComponent, ParameterType, SelectOption } from '../../../../../../shared/controls/custom-select/custom-select.component';

@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    CustomSelectComponent,
  ],
  templateUrl: './incident-form.component.html',
  styleUrls: ['./incident-form.component.scss']
})
export class IncidentFormComponent implements OnInit, OnChanges {
  @Input() projectId: string | null = null;

  // FormControls para el formulario
  responsableAreaControl = new FormControl('', { validators: [Validators.required] });
  fechaControl = new FormControl(new Date(), { validators: [Validators.required] });
  potencialGravedadControl = new FormControl('', { validators: [Validators.required] });
  ameritaControl = new FormControl('', { validators: [Validators.required] });
  situacionObservadaControl = new FormControl('', { validators: [Validators.required] });
  tipoIncidenteControl = new FormControl('', { validators: [Validators.required] });
  activityControl = new FormControl('');
  specialtyControl = new FormControl('');
  contractorControl = new FormControl('');
  supervisorControl = new FormControl('');
  dateControl = new FormControl(new Date());

  // Configuración para el app-custom-select
  customApiEndpoint = '/ws/UsuarioSvcImpl.php';
  customApiRequestBody: any;
  customOptionValueKey = 'IdUsuario';
  customOptionLabelKey = 'Nombre';
  parameterType = ParameterType.CUSTOM_API;

  constructor() {}

  ngOnInit(): void {
    this.updateApiRequestBody();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId']) {
      this.updateApiRequestBody();
    }
  }

  updateApiRequestBody(): void {
    if (this.projectId) {
      this.customApiRequestBody = {
        "caso": "ConsultaUsuariosObra",
        "idObra": parseInt(this.projectId),
        "idUsuario": 0
      };
    }
  }
  
  /**
   * Obtiene los datos del formulario de incidente
   */
  getFormData() {
    return {
      responsableArea: this.responsableAreaControl.value,
      fecha: this.fechaControl.value,
      potencialGravedad: this.potencialGravedadControl.value,
      amerita: this.ameritaControl.value,
      situacionObservada: this.situacionObservadaControl.value,
      tipoIncidente: this.tipoIncidenteControl.value,
      activity: this.activityControl.value,
      specialty: this.specialtyControl.value,
      contractor: this.contractorControl.value,
      supervisor: this.supervisorControl.value
    };
  }
  
  /**
   * Verifica si el formulario es válido
   */
  isFormValid(): boolean {
    return (
      this.responsableAreaControl.valid &&
      this.fechaControl.valid &&
      this.potencialGravedadControl.valid &&
      this.ameritaControl.valid &&
      this.situacionObservadaControl.valid &&
      this.tipoIncidenteControl.valid
    );
  }
}
