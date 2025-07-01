import { Component, Inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

// Importamos correctamente el CustomSelectComponent con la ruta relativa adecuada
import { CustomSelectComponent } from '../../../../../../shared/controls/custom-select/custom-select.component';

// Definimos la interfaz SelectOption para las opciones de los selectores
interface SelectOption {
  value: string | number;
  label: string;
}

export interface ArtModalData {
  activityId?: number;
  projectId?: number;
  idControl?: string;
  day?: number;
}

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
    CustomSelectComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './art-modal.component.html',
  styleUrls: ['./art-modal.component.scss']
})
export class ArtModalComponent implements OnInit {
  artForm!: FormGroup;
  
  // Mock options para selectores
  specialtyOptions: SelectOption[] = [
    { value: '1', label: 'Construcción Civil' },
    { value: '2', label: 'Albañilería' },
    { value: '3', label: 'Estructuras' }
  ];
  
  contractorOptions: SelectOption[] = [
    { value: '1', label: 'Contratista A' },
    { value: '2', label: 'Contratista B' },
    { value: '3', label: 'Contratista C' }
  ];
  
  supervisorOptions: SelectOption[] = [
    { value: '1', label: 'Juan Pérez' },
    { value: '2', label: 'Maria González' },
    { value: '3', label: 'Carlos Rodríguez' }
  ];
  
  // Getters para los controles del formulario (soluciona problema de tipado)
  get activityControl(): FormControl { return this.artForm.get('activity') as FormControl; }
  get specialtyControl(): FormControl { return this.artForm.get('specialty') as FormControl; }
  get contractorControl(): FormControl { return this.artForm.get('contractor') as FormControl; }
  get supervisorControl(): FormControl { return this.artForm.get('supervisor') as FormControl; }
  get dateControl(): FormControl { return this.artForm.get('date') as FormControl; }
  get sstProcedureControl(): FormControl { return this.artForm.get('sstProcedure') as FormControl; }
  get sstStandardControl(): FormControl { return this.artForm.get('sstStandard') as FormControl; }
  get operationalProcedureControl(): FormControl { return this.artForm.get('operationalProcedure') as FormControl; }
  get documentNameControl(): FormControl { return this.artForm.get('documentName') as FormControl; }
  get codeControl(): FormControl { return this.artForm.get('code') as FormControl; }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ArtModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ArtModalData
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.artForm = this.fb.group({
      activity: ['', Validators.required],
      specialty: ['', Validators.required],
      contractor: ['', Validators.required],
      supervisor: ['', Validators.required],
      date: [new Date(), Validators.required],
      sstProcedure: [false],
      sstStandard: [false],
      operationalProcedure: [false],
      documentName: [''],
      code: ['']
    });
    
    // Si hay datos preexistentes, cargarlos en el formulario
    if (this.data && this.data.activityId) {
      // Aquí podríamos cargar datos desde la API según el activityId
    }
  }

  onSave() {
    if (this.artForm.valid) {
      this.dialogRef.close(this.artForm.value);
    } else {
      // Marcar todos los controles como tocados para mostrar errores
      Object.keys(this.artForm.controls).forEach(key => {
        const control = this.artForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
