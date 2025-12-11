import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormQuestion, FormValue } from '../../models/form.models';

@Component({
  selector: 'app-multiple-choice-field',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ question.name }}</mat-label>
      <mat-select
        multiple
        [required]="question.required"
        [disabled]="(question.read_only ?? false) || disabled"
        [(ngModel)]="selectedValues"
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
    
    <!-- Mostrar chips de los valores seleccionados -->
    <div class="selected-chips" *ngIf="selectedValues.length > 0">
      <mat-chip-listbox>
        <mat-chip *ngFor="let value of selectedValues" class="selected-chip">
          {{ getTextForValue(value) }}
        </mat-chip>
      </mat-chip-listbox>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    
    :host {
      display: block;
      margin-bottom: 16px;
    }
    
    .selected-chips {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .selected-chip {
      font-size: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultipleChoiceFieldComponent implements OnChanges {
  @Input() question!: FormQuestion;
  @Input() options: FormValue[] = []; // Opciones dinámicas basadas en el padre
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<{ id: string; values: (string | number)[]; texts: string[] }>();

  selectedValues: (string | number)[] = [];
  currentOptions: FormValue[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    // Actualizar opciones cuando cambian
    if (changes['options']) {
      this.currentOptions = this.options || [];
      // Resetear selección cuando cambian las opciones
      this.selectedValues = [];
    } else if (changes['question'] && this.question) {
      // Si no hay opciones dinámicas, usar las de la question
      if (!this.question.query_values) {
        this.currentOptions = this.question.values || [];
      }
    }
  }

  onSelectionChange(values: (string | number)[]): void {
    const texts = values.map(v => this.getTextForValue(v));
    this.valueChange.emit({
      id: this.question.id,
      values: values,
      texts: texts
    });
  }

  getTextForValue(value: string | number): string {
    const option = this.currentOptions.find(opt => opt.value === value);
    return option?.text || String(value);
  }
}
