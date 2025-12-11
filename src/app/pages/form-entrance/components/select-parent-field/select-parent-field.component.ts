import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormQuestion, FormValue, SubParam } from '../../models/form.models';

@Component({
  selector: 'app-select-parent-field',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <!-- Select principal (padre) -->
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ question.name }}</mat-label>
      <mat-select
        [required]="question.required"
        [disabled]="question.read_only ?? false"
        [(ngModel)]="selectedValue"
        (selectionChange)="onSelectionChange($event.value)"
      >
        <mat-option *ngFor="let option of question.values" [value]="option.value">
          {{ option.text }}
        </mat-option>
      </mat-select>
      <mat-hint *ngIf="question.required">* Campo requerido</mat-hint>
    </mat-form-field>

    <!-- Select hijo (generado automáticamente si hay sub_params) -->
    <mat-form-field 
      *ngIf="question.sub_params && question.sub_params.length > 0" 
      appearance="outline" 
      class="full-width child-select"
    >
      <mat-label>Seleccionar opción</mat-label>
      <mat-select
        [disabled]="!selectedValue"
        [(ngModel)]="selectedChildValue"
        (selectionChange)="onChildSelectionChange($event.value)"
      >
        <mat-option *ngFor="let option of currentChildOptions" [value]="option.value">
          {{ option.text }}
        </mat-option>
      </mat-select>
      <mat-hint *ngIf="!selectedValue">Seleccione una opción en el campo anterior</mat-hint>
      <mat-hint *ngIf="selectedValue">* Campo requerido</mat-hint>
    </mat-form-field>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    :host {
      display: block;
      margin-bottom: 16px;
    }

    .child-select {
      margin-top: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectParentFieldComponent implements OnInit {
  @Input() question!: FormQuestion;
  @Output() valueChange = new EventEmitter<{ id: string; value: string | number; text: string }>();
  @Output() subParamsChange = new EventEmitter<FormValue[]>();
  @Output() childValueChange = new EventEmitter<{ parentId: string; value: string | number; text: string }>();

  selectedValue: string | number | null = null;
  selectedChildValue: string | number | null = null;
  currentChildOptions: FormValue[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('=== SelectParentField ngOnInit ===');
    console.log('Question ID:', this.question.id);
    console.log('Has sub_params:', !!(this.question.sub_params && this.question.sub_params.length > 0));
  }

  onSelectionChange(value: string | number): void {
    console.log('=== SelectParentField onSelectionChange ===');
    console.log('Selected value:', value);
    
    const selectedOption = this.question.values.find(opt => opt.value === value);
    
    // Emitir el valor seleccionado del padre
    this.valueChange.emit({
      id: this.question.id,
      value: value,
      text: selectedOption?.text || ''
    });

    // Resetear selección del hijo
    this.selectedChildValue = null;

    // Buscar y cargar las opciones del hijo
    if (this.question.sub_params && this.question.sub_params.length > 0) {
      const subParam = this.question.sub_params.find(sp => sp.opt === String(value));
      
      if (subParam) {
        console.log('Loading child options:', subParam.values.length, 'items');
        this.currentChildOptions = subParam.values;
        this.subParamsChange.emit(subParam.values);
      } else {
        console.log('No matching subParam found');
        this.currentChildOptions = [];
        this.subParamsChange.emit([]);
      }
    }
    
    this.cdr.markForCheck();
  }

  onChildSelectionChange(value: string | number): void {
    console.log('=== SelectParentField onChildSelectionChange ===');
    console.log('Child selected value:', value);
    
    const selectedOption = this.currentChildOptions.find(opt => opt.value === value);
    
    // Emitir el valor seleccionado del hijo
    this.childValueChange.emit({
      parentId: this.question.id,
      value: value,
      text: selectedOption?.text || ''
    });
  }

  // Método para obtener los sub_params de un valor específico
  getSubParamsForValue(value: string | number): FormValue[] {
    if (!this.question.sub_params) return [];
    const subParam = this.question.sub_params.find(sp => sp.opt === String(value));
    return subParam?.values || [];
  }
}
