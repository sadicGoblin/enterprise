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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { 
  TIPO_ACCIDENTE_OPTIONS, 
  CALIFICACION_PS_OPTIONS, 
  DIA_SEMANA_OPTIONS,
  ESTADO_ACCIDENTE_OPTIONS 
} from './models/accident.model';

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
    MatSnackBarModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './accidents.component.html',
  styleUrl: './accidents.component.scss'
})
export class AccidentsComponent implements OnInit {
  isLoading = false;
  accidentForm!: FormGroup;
  currentStep = 0;

  // Opciones basadas en el Excel
  tipoAccidenteOptions = TIPO_ACCIDENTE_OPTIONS;
  calificacionPSOptions = CALIFICACION_PS_OPTIONS;
  diaSemanaOptions = DIA_SEMANA_OPTIONS;
  estadoOptions = ESTADO_ACCIDENTE_OPTIONS;

  // Opciones de obras (mock - se cargarían de API)
  obraOptions = [
    { id: 1, nombre: 'CD PROCENTRO III' },
    { id: 2, nombre: 'CC Linares' },
    { id: 3, nombre: 'Outlet La Calera' },
    { id: 4, nombre: 'TEGA' },
    { id: 5, nombre: 'NOVOLUCERO' }
  ];

  // Opciones de empresas (mock - se cargarían de API)
  empresaOptions = [
    { id: 1, nombre: 'INARCO' },
    { id: 2, nombre: 'SC B&J' },
    { id: 3, nombre: 'SC AR Montajes' },
    { id: 4, nombre: 'SC M.Acuña' },
    { id: 5, nombre: 'SC ELYON' }
  ];

  // Opciones de cargos
  cargoOptions = [
    'Hojalatero', 'Maestro Montajista', 'Rigger', 'Carpintero', 
    'Pañolero', 'Jornal', 'Maestro Moldajero', 'Enfierrador',
    'Operador', 'Soldador', 'Electricista', 'Gasfiter'
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.accidentForm = this.fb.group({
      // ========== DATOS PRINCIPALES ==========
      obra: ['', Validators.required],
      numAccidente: [1, [Validators.required, Validators.min(1)]],
      numEnfermedadProfesional: [null],
      diasPerdidosEstimados: [null, Validators.min(0)],
      fechaAccidente: ['', Validators.required],
      horaAccidente: ['', Validators.required],
      fechaControl: [''],
      diasPerdidosFinal: [null, Validators.min(0)],
      tipoAccidente: ['Trabajo', Validators.required],
      empresa: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      
      // ========== DATOS DEL TRABAJADOR ==========
      trabajadorRut: ['', Validators.required],
      trabajadorNombre: ['', Validators.required],
      trabajadorEdad: ['', [Validators.required, Validators.min(18), Validators.max(80)]],
      trabajadorHorario: [''],
      trabajadorDia: ['', Validators.required],
      trabajadorCargo: ['', Validators.required],
      
      // ========== LÍNEA DE MANDO ==========
      supervisor: ['', Validators.required],
      pTerreno: [''],
      apr: [''],
      ado: [''],
      
      // ========== ANÁLISIS / TIPOLOGÍA ==========
      calificacionPS: ['', Validators.required],
      fuente: [''],
      accion: [''],
      condicion: [''],
      maquina: [''],
      equipo: [''],
      
      // ========== GESTIÓN DEL CAMBIO ==========
      causaRaiz: [''],
      ctrlEliminacion: [false],
      ctrlSustitucion: [false],
      ctrlIngenieria: [false],
      ctrlAdministracion: [false],
      ctrlEPP: [false],
      observaciones: [''],
      
      // ========== METADATOS ==========
      estado: ['Reportado', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.accidentForm.valid) {
      this.isLoading = true;
      
      // Simular guardado
      setTimeout(() => {
        this.isLoading = false;
        console.log('Form Data:', this.accidentForm.value);
        this.showMessage('Accidente registrado correctamente', 'success');
        this.router.navigate(['/check-list/accidents/list']);
      }, 1000);
    } else {
      this.showMessage('Complete todos los campos requeridos', 'error');
      this.markFormGroupTouched(this.accidentForm);
    }
  }

  onReset(): void {
    this.accidentForm.reset({
      numAccidente: 1,
      tipoAccidente: 'Trabajo',
      estado: 'Reportado',
      ctrlEliminacion: false,
      ctrlSustitucion: false,
      ctrlIngenieria: false,
      ctrlAdministracion: false,
      ctrlEPP: false
    });
    this.currentStep = 0;
    this.showMessage('Formulario reiniciado', 'info');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? 'snack-error' : type === 'success' ? 'snack-success' : ''
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.accidentForm.get(fieldName);
    if (control?.hasError('required')) return 'Campo requerido';
    if (control?.hasError('minlength')) return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    if (control?.hasError('min')) return `Valor mínimo: ${control.errors?.['min'].min}`;
    if (control?.hasError('max')) return `Valor máximo: ${control.errors?.['max'].max}`;
    return '';
  }

  goToList(): void {
    this.router.navigate(['/check-list/accidents/list']);
  }

  goToStatistics(): void {
    this.router.navigate(['/check-list/accidents/statistics']);
  }

  nextStep(): void {
    if (this.currentStep < 4) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  isStepValid(step: number): boolean {
    const fieldsPerStep: Record<number, string[]> = {
      0: ['obra', 'fechaAccidente', 'tipoAccidente', 'empresa', 'descripcion'],
      1: ['trabajadorRut', 'trabajadorNombre', 'trabajadorEdad', 'trabajadorDia', 'trabajadorCargo'],
      2: ['supervisor'],
      3: ['calificacionPS'],
      4: []
    };
    
    return fieldsPerStep[step]?.every(field => {
      const control = this.accidentForm.get(field);
      return control?.valid;
    }) ?? true;
  }
}
