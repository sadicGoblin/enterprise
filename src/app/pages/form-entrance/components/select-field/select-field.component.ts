import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormQuestion, FormValue } from '../../models/form.models';

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ question.name }}</mat-label>
      <mat-select
        [required]="question.required"
        [disabled]="(question.read_only ?? false) || disabled"
        [(ngModel)]="selectedValue"
        (selectionChange)="onSelectionChange($event.value)"
      >
        <mat-option *ngFor="let option of currentOptions" [value]="option.value">
          {{ option.text }}
        </mat-option>
      </mat-select>
      <mat-hint *ngIf="disabled && !question.read_only; else requiredHint">Seleccione una opción en el campo anterior</mat-hint>
      <ng-template #requiredHint>
        <mat-hint *ngIf="question.required">* Campo requerido</mat-hint>
      </ng-template>
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectFieldComponent implements OnChanges {
  @Input() question!: FormQuestion;
  @Input() dynamicOptions: FormValue[] | null | undefined = null;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<{ id: string; value: string | number; text: string }>();

  selectedValue: string | number | null = null;
  currentOptions: FormValue[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('=== SelectField ngOnChanges ===');
    console.log('Question:', this.question?.id);
    console.log('dynamicOptions changed:', !!changes['dynamicOptions']);
    console.log('dynamicOptions value:', this.dynamicOptions);
    console.log('dynamicOptions length:', this.dynamicOptions?.length || 0);
    
    // Si hay opciones dinámicas, usarlas; sino usar las de la question
    if (this.dynamicOptions && this.dynamicOptions.length > 0) {
      console.log('Using dynamic options');
      this.currentOptions = [...this.dynamicOptions]; // Crear nueva referencia
    } else if (this.question) {
      console.log('Using question values');
      this.currentOptions = this.question.values || [];
    }
    
    console.log('currentOptions set to:', this.currentOptions.length, 'items');
    
    // Resetear selección si las opciones cambiaron
    if (changes['dynamicOptions'] && !changes['dynamicOptions'].firstChange) {
      this.selectedValue = null;
    }
    
    // Forzar detección de cambios
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onSelectionChange(value: string | number): void {
    const selectedOption = this.currentOptions.find(opt => opt.value === value);
    this.valueChange.emit({
      id: this.question.id,
      value: value,
      text: selectedOption?.text || ''
    });
  }
}
