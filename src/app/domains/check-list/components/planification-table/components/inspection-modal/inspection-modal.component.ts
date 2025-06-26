import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';

interface InspectionItem {
  id?: number;
  condicionRiesgo: string;
  incidencia: string;
  potencialRiesgo: string;
  clasificacionHallazgo: string;
  medidaCorrectiva: string;
  responsable: string;
  fechaCompromiso: Date;
  fechaCierre: Date;
}

interface UserOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-inspection-modal',
  templateUrl: './inspection-modal.component.html',
  styleUrls: ['./inspection-modal.component.scss'],
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
    MatTabsModule,
    MatCardModule,
    MatTableModule
  ]
})
export class InspectionModalComponent implements OnInit {
  inspectionForm: FormGroup;
  selectedTabIndex = 0;
  displayedColumns: string[] = [
    'condicionRiesgo',
    'incidencia',
    'potencialRiesgo',
    'clasificacionHallazgo',
    'medidaCorrectiva',
    'responsable',
    'fechaCompromiso',
    'fechaCierre',
    'actions'
  ];
  
  // Opciones ficticias para los selects, normalmente vendrían de un servicio
  userOptions: UserOption[] = [
    { id: '1', name: 'FELIPE GALLARDO' },
    { id: '2', name: 'GERMAN MEDINA' },
    { id: '3', name: 'JUAN PÉREZ' },
  ];
  
  riskOptions: string[] = ['SEGURIDAD', 'SALUD', 'MEDIO AMBIENTE', 'OTRO'];
  potentialRiskOptions: string[] = ['LEVE', 'MEDIANAMENTE GRAVE', 'GRAVE', 'MUY GRAVE'];
  classificationOptions: string[] = ['OBSERVACIÓN', 'NO CONFORMIDAD', 'POTENCIAL NO CONFORMIDAD'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InspectionModalComponent>,
    private dateAdapter: DateAdapter<Date>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.dateAdapter.setLocale('es');
    
    this.inspectionForm = this.fb.group({
      inspectionType: ['programada', Validators.required], // programada o informal
      date: [new Date(), Validators.required],
      realizadoPor: ['', Validators.required],
      observation: [''],
      responsableAsignado: [''],
      items: this.fb.array([])
    });
    
    // Agregar un item inicial a la tabla
    this.addItem();
  }

  ngOnInit(): void {
    if (this.data && this.data.inspectionData) {
      // Si recibimos datos, rellenar el formulario
      this.inspectionForm.patchValue(this.data.inspectionData);
    }
  }

  get items(): FormArray {
    return this.inspectionForm.get('items') as FormArray;
  }

  addItem(): void {
    const item = this.fb.group({
      condicionRiesgo: ['TEST', Validators.required],
      incidencia: ['SEGURIDAD', Validators.required],
      potencialRiesgo: ['MEDIANAMENTE GRAVE', Validators.required],
      clasificacionHallazgo: ['OBSERVACIÓN', Validators.required],
      medidaCorrectiva: ['REVISAR TEST', Validators.required],
      responsable: ['GERMAN MEDINA', Validators.required],
      fechaCompromiso: [new Date(), Validators.required],
      fechaCierre: [new Date(), Validators.required]
    });

    this.items.push(item);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  saveAsPDF(): void {
    // En producción, implementar la lógica de guardar como PDF
    console.log('Guardar como PDF', this.inspectionForm.value);
  }

  onSave(): void {
    if (this.inspectionForm.valid) {
      this.dialogRef.close(this.inspectionForm.value);
    } else {
      // Marcar todos los controles como tocados para mostrar errores
      this.markFormGroupTouched(this.inspectionForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onTabChange(event: any): void {
    this.selectedTabIndex = event.index;
    const inspectionType = event.index === 0 ? 'programada' : 'informal';
    this.inspectionForm.get('inspectionType')?.setValue(inspectionType);
  }
}
