import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { CustomSelectComponent } from '../../../../../../../../shared/controls/custom-select/custom-select.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

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
  selector: 'app-art-forms',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomSelectComponent,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './art-forms.component.html',
  styleUrl: './art-forms.component.scss'
})
export class ArtFormsComponent implements OnInit {
  artForm!: FormGroup;
  
  // Definir los FormControls individuales
  activityControl = new FormControl('', Validators.required);
  specialtyControl = new FormControl('', Validators.required);
  contractorControl = new FormControl('', Validators.required);
  supervisorControl = new FormControl('', Validators.required);
  dateControl = new FormControl(new Date(), Validators.required);
  sstProcedureControl = new FormControl(false);
  sstStandardControl = new FormControl(false);
  operationalProcedureControl = new FormControl(false);
  documentNameControl = new FormControl('');
  codeControl = new FormControl('');
  
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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.artForm = this.fb.group({
      activity: this.activityControl,
      specialty: this.specialtyControl,
      contractor: this.contractorControl,
      supervisor: this.supervisorControl,
      date: this.dateControl,
      sstProcedure: this.sstProcedureControl,
      sstStandard: this.sstStandardControl,
      operationalProcedure: this.operationalProcedureControl,
      documentName: this.documentNameControl,
      code: this.codeControl,
    });
  }
  
  /**
   * Alterna el valor de un control de formulario booleano
   * @param control FormControl a alternar
   */
  toggleOption(control: FormControl): void {
    control.setValue(!control.value);
  }

  onSave(): void {
    if (this.artForm.valid) {
      console.log('Formulario válido:', this.artForm.value);
    } else {
      // Marcar todos los controles como tocados para mostrar errores
      Object.keys(this.artForm.controls).forEach(key => {
        const control = this.artForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
