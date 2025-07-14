import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import {
  CustomSelectComponent,
  ParameterType,
  SelectOption,
} from '../../../../../../shared/controls/custom-select/custom-select.component';
import { UserContextService } from '../../../../../../core/services/user-context.service';

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
  styleUrls: ['./incident-form.component.scss'],
})
export class IncidentFormComponent implements OnInit, OnChanges {
  @Input() projectId: string | null = null;

  // API Parameters for obra selection - Using the same pattern as add-activities-pp
  projectControl = new FormControl('');
  projectApiEndpoint = '/ws/ObrasSvcImpl.php';
  projectApiRequestBody: any;
  projectOptionValueKey = 'IdObra';
  projectOptionLabelKey = 'Obra';
  projectParameterType = ParameterType.OBRA;

  // FormControls para el formulario
  responsableAreaControl = new FormControl({ value: '', disabled: true }, {
    validators: [Validators.required],
  });
  fechaControl = new FormControl(new Date(), {
    validators: [Validators.required],
  });
  potencialGravedadControl = new FormControl('', {
    validators: [Validators.required],
  });
  ameritaControl = new FormControl('', { validators: [Validators.required] });
  situacionObservadaControl = new FormControl('', {
    validators: [Validators.required],
  });
  tipoIncidenteControl = new FormControl('', {
    validators: [Validators.required],
  });
  activityControl = new FormControl('');
  specialtyControl = new FormControl('');
  contractorControl = new FormControl('');
  supervisorControl = new FormControl('');
  dateControl = new FormControl(new Date());

  // Configuración para el app-custom-select
  customApiEndpoint = '/ws/UsuarioSvcImpl.php';
  customApiRequestBody: any = { caso: 'ConsultaUsuariosObra', idObra: 0, idUsuario: 0 }; // Valor inicial para evitar error
  customOptionValueKey = 'IdUsuario';
  customOptionLabelKey = 'Nombre';
  parameterType = ParameterType.CUSTOM_API;
  loadResponsableApi = false; // Control para evitar la carga hasta seleccionar obra

  constructor(private userContextService: UserContextService) {}

  ngOnInit(): void {
    // this.updateApiRequestBody();
    this.setupApiRequest();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId']) {
      this.updateApiRequestBody();
    }
  }

  updateApiRequestBody(): void {
    if (this.projectId) {
      // Convertir el ID a número entero de forma segura
      const obraId = Number(this.projectId);
      
      // Actualizar el objeto de solicitud con el nuevo ID de obra
      this.customApiRequestBody = {
        caso: 'ConsultaUsuariosObra',
        idObra: obraId,
        idUsuario: 0,
      };
      
      console.log('[IncidentFormComponent] Updated API request body with obra ID:', obraId);
      console.log('[IncidentFormComponent] Request body:', this.customApiRequestBody);
    } else {
      console.warn('[IncidentFormComponent] Cannot update API request - no project ID available');
    }
  }

  setupApiRequest(): void {
    const userId = this.userContextService.getUserId() || 0;
    this.projectApiRequestBody = {
      caso: 'Consulta',
      idObra: 0,
      idUsuario: userId,
    };
  }

  onProjectSelectionChange(selectedProject: SelectOption | null): void {
    this.loadResponsableApi = false;
    console.log('[IncidentFormComponent] Project selected:', selectedProject);
    
    if (selectedProject && selectedProject.value) {
      // Guardar el ID del proyecto seleccionado
      this.projectId = selectedProject.value.toString();
      console.log('[IncidentFormComponent] Project ID set to:', this.projectId);
      
      // Deshabilitar temporalmente y resetear el control de responsable mientras se actualiza la API
      this.responsableAreaControl.disable();
      this.responsableAreaControl.setValue('');
      
      // Actualizar los parámetros para la solicitud API con el nuevo ID
      this.updateApiRequestBody();
      
      // Secuencia controlada para actualizar el componente
      setTimeout(() => {
        // 1. Primero activar la carga de la API para el responsable
        this.loadResponsableApi = true;
        console.log('[IncidentFormComponent] Activating API loading for responsable');
        
        // 2. Luego de un breve retraso, habilitar el control para permitir selección
        setTimeout(() => {
          this.responsableAreaControl.enable();
          console.log('[IncidentFormComponent] Enabled responsable área selector');
        }, 300);
      }, 200);
    } else {
      // Si no hay obra seleccionada, deshabilitar y resetear el control
      this.projectId = null;
      this.loadResponsableApi = false;
      this.responsableAreaControl.disable();
      this.responsableAreaControl.setValue('');
      console.log('[IncidentFormComponent] Disabled responsable área selector');
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
      supervisor: this.supervisorControl.value,
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
