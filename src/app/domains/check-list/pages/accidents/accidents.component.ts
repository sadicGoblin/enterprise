import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accidents',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './accidents.component.html',
  styleUrl: './accidents.component.scss'
})
export class AccidentsComponent implements OnInit {
  // Loading state
  isLoading = false;
  
  // Form
  accidentForm!: FormGroup;

  // Dropdown options
  projectOptions = [
    'Proyecto A',
    'Proyecto B',
    'Proyecto C'
  ];

  areaOptions = [
    'Producción',
    'Mantenimiento',
    'Administración',
    'Logística',
    'Seguridad'
  ];

  accidentTypeOptions = [
    'Leve',
    'Grave',
    'Fatal',
    'Incapacitante',
    'Sin lesión'
  ];

  bodyPartOptions = [
    'Cabeza',
    'Ojos',
    'Manos',
    'Brazos',
    'Piernas',
    'Pies',
    'Espalda',
    'Tórax',
    'Abdomen',
    'Múltiples'
  ];

  accidentCauseOptions = [
    'Acto inseguro',
    'Condición insegura',
    'Falta de EPP',
    'Falta de capacitación',
    'Falla de equipo',
    'Factores ambientales',
    'Otro'
  ];

  severityOptions = [
    'Baja',
    'Media',
    'Alta',
    'Crítica'
  ];

  statusOptions = [
    'Reportado',
    'En investigación',
    'Cerrado',
    'Pendiente'
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize the accident form with all fields
   */
  initializeForm(): void {
    this.accidentForm = this.fb.group({
      // Basic Information
      accidentNumber: ['', Validators.required],
      reportDate: [new Date(), Validators.required],
      accidentDate: ['', Validators.required],
      accidentTime: ['', Validators.required],
      
      // Location Information
      project: ['', Validators.required],
      area: ['', Validators.required],
      specificLocation: ['', Validators.required],
      
      // Person Information
      workerName: ['', Validators.required],
      workerRut: ['', Validators.required],
      workerPosition: ['', Validators.required],
      workerCompany: ['', Validators.required],
      workerAge: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
      workerExperience: ['', Validators.required],
      
      // Accident Details
      accidentType: ['', Validators.required],
      bodyPart: ['', Validators.required],
      severity: ['', Validators.required],
      accidentDescription: ['', [Validators.required, Validators.minLength(20)]],
      
      // Causes and Analysis
      immediateCause: ['', Validators.required],
      rootCause: ['', Validators.required],
      contributingFactors: [''],
      
      // Witnesses
      hasWitnesses: [false],
      witnessNames: [''],
      witnessStatements: [''],
      
      // Medical Attention
      medicalAttentionRequired: [false],
      medicalCenter: [''],
      diagnosis: [''],
      daysOff: [0, [Validators.min(0)]],
      medicalLeaveStartDate: [''],
      medicalLeaveEndDate: [''],
      
      // Corrective Actions
      immediateActions: ['', Validators.required],
      correctiveActions: ['', Validators.required],
      preventiveActions: [''],
      responsiblePerson: ['', Validators.required],
      actionDeadline: [''],
      
      // Investigation
      investigatedBy: ['', Validators.required],
      investigationDate: [''],
      status: ['Reportado', Validators.required],
      
      // Additional Information
      equipmentInvolved: [''],
      weatherConditions: [''],
      lightingConditions: [''],
      wasUsingPPE: [false],
      ppeDetails: [''],
      
      // Photos and Documents
      hasPhotos: [false],
      hasDocuments: [false],
      observations: ['']
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.accidentForm.valid) {
      console.log('Form Data:', this.accidentForm.value);
      this.showMessage('Formulario válido. Datos listos para enviar.');
    } else {
      this.showMessage('Por favor complete todos los campos requeridos.');
      this.markFormGroupTouched(this.accidentForm);
    }
  }

  /**
   * Reset the form
   */
  onReset(): void {
    this.accidentForm.reset({
      reportDate: new Date(),
      status: 'Reportado',
      hasWitnesses: false,
      medicalAttentionRequired: false,
      daysOff: 0,
      wasUsingPPE: false,
      hasPhotos: false,
      hasDocuments: false
    });
    this.showMessage('Formulario reiniciado.');
  }

  /**
   * Mark all fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Show a snackbar message
   */
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.accidentForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `Valor mínimo: ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `Valor máximo: ${control.errors?.['max'].max}`;
    }
    return '';
  }

  /**
   * Navigate to accidents list
   */
  goToList(): void {
    this.router.navigate(['/check-list/accidents/list']);
  }

  /**
   * Navigate to statistics
   */
  goToStatistics(): void {
    this.router.navigate(['/check-list/accidents/statistics']);
  }
}
