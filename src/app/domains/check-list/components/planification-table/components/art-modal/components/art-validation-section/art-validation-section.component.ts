import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface Person {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

@Component({
  selector: 'app-art-validation-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './art-validation-section.component.html',
  styleUrl: './art-validation-section.component.scss'
})
export class ArtValidationSectionComponent implements OnInit {
  // Form controls para los selects y inputs
  reviewerNameControl = new FormControl<string>('');
  reviewerPositionControl = new FormControl<string>('');
  reviewerDateControl = new FormControl<Date | null>(new Date());
  
  validatorNameControl = new FormControl<string>('');
  validatorPositionControl = new FormControl<string>('');
  validatorDateControl = new FormControl<Date | null>(new Date());
  
  ssomaObservationsControl = new FormControl<string>('');
  generalObservationsControl = new FormControl<string>('');
  
  // Datos de ejemplo para los selects
  reviewersList: Person[] = [
    { id: '1', name: 'Juan Pérez' },
    { id: '2', name: 'María González' },
    { id: '3', name: 'Carlos Rodríguez' },
    { id: '4', name: 'Ana Martínez' }
  ];
  
  validatorsList: Person[] = [
    { id: '1', name: 'Juan Pérez' },
    { id: '2', name: 'María González' },
    { id: '3', name: 'Carlos Rodríguez' },
    { id: '4', name: 'Ana Martínez' },
    { id: '5', name: 'Roberto Sánchez' }
  ];
  
  positionsList: Position[] = [
    { id: '1', name: 'Supervisor de Obra' },
    { id: '2', name: 'Jefe de Seguridad' },
    { id: '3', name: 'Inspector SSOMA' },
    { id: '4', name: 'Gerente de Proyecto' },
    { id: '5', name: 'Coordinador de Calidad' }
  ];
  
  constructor() {}
  
  ngOnInit(): void {
    // Escuchar cambios en los controles si es necesario
    this.reviewerNameControl.valueChanges.subscribe(value => {
      console.log('Nombre del revisor seleccionado:', value);
    });
    
    this.validatorNameControl.valueChanges.subscribe(value => {
      console.log('Nombre del validador seleccionado:', value);
    });
  }
  
  // Método para guardar los datos de validación
  saveValidation(): void {
    const validationData = {
      reviewer: {
        name: this.reviewerNameControl.value,
        position: this.reviewerPositionControl.value,
        date: this.reviewerDateControl.value
      },
      validator: {
        name: this.validatorNameControl.value,
        position: this.validatorPositionControl.value,
        date: this.validatorDateControl.value
      },
      observations: {
        ssoma: this.ssomaObservationsControl.value,
        general: this.generalObservationsControl.value
      }
    };
    
    console.log('Datos de validación:', validationData);
    // Aquí se implementaría la llamada a la API para guardar los datos
  }
}
