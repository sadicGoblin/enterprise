import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-year-month-picker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <!-- Year-month picker component template -->
    <div class="year-month-picker">
      <form [formGroup]="form">
        <div class="picker-container">
          <mat-form-field [appearance]="appearance" class="year-select">
            <mat-label>Año</mat-label>
            <mat-select formControlName="year" (blur)="onBlur()">
              <mat-option *ngFor="let year of years" [value]="year">
                {{ year }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('year').hasError('required') && form.get('year').touched">
              Año requerido
            </mat-error>
          </mat-form-field>
          
          <mat-form-field [appearance]="appearance" class="month-select">
            <mat-label>Mes</mat-label>
            <mat-select formControlName="month" (blur)="onBlur()">
              <mat-option *ngFor="let month of months" [value]="month.value">
                {{ month.viewValue }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('month').hasError('required') && form.get('month').touched">
              Mes requerido
            </mat-error>
          </mat-form-field>
          
          <button mat-icon-button 
                  type="button"
                  class="current-period-button"
                  matTooltip="Seleccionar periodo actual"
                  (click)="selectCurrentPeriod()">
            <mat-icon>today</mat-icon>
          </button>
        </div>
        
        <div *ngIf="form.valid" class="preview">
          <span class="period-label">Periodo seleccionado:</span>
          <span class="period-value">{{ formatYearMonth(form.get('year').value, form.get('month').value) }}</span>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .year-month-picker {
      display: block;
      
      .picker-container {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .year-select {
          flex: 1;
        }
        
        .month-select {
          flex: 1.5;
        }
        
        .current-period-button {
          margin-top: -16px; // Alinear con los campos de formulario
        }
      }
      
      .preview {
        margin-top: 8px;
        padding: 8px 12px;
        background-color: rgba(0, 0, 0, 0.04);
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        
        .period-label {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
        }
        
        .period-value {
          font-size: 16px;
          font-weight: 500;
          color: #1976d2;
        }
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => YearMonthPickerComponent),
      multi: true
    }
  ]
})
export class YearMonthPickerComponent implements OnInit, ControlValueAccessor {
  @Input() label: string = 'Periodo';
  @Input() placeholder: string = 'Seleccione un periodo';
  @Input() minYear: number = new Date().getFullYear() - 5;  // 5 años atrás por defecto
  @Input() maxYear: number = new Date().getFullYear() + 5;  // 5 años adelante por defecto
  @Input() required: boolean = false;
  @Input() appearance: 'fill' | 'outline' = 'outline';
  @Input() disabled: boolean = false;

  // Para formulario interno
  form: FormGroup;
  
  // Arrays para los selectores
  months: { value: number, viewValue: string }[] = [];
  years: number[] = [];
  
  // Para el ControlValueAccessor
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};
  
  constructor() {
    // Inicializar el formulario
    this.form = new FormGroup({
      year: new FormControl(null, Validators.required),
      month: new FormControl(null, Validators.required)
    });
    
    // Escuchar cambios en el formulario
    this.form.valueChanges.subscribe(value => {
      if (this.form.valid) {
        const yearMonth = this.formatYearMonth(value.year, value.month);
        this.onChange(yearMonth);
      } else {
        this.onChange(null);
      }
    });
  }
  
  ngOnInit(): void {
    this.setupMonths();
    this.setupYears();
    
    // Deshabilitar el formulario si es necesario
    if (this.disabled) {
      this.form.disable();
    }
  }
  
  // Configurar los meses disponibles
  setupMonths(): void {
    this.months = [
      { value: 1, viewValue: 'Enero' },
      { value: 2, viewValue: 'Febrero' },
      { value: 3, viewValue: 'Marzo' },
      { value: 4, viewValue: 'Abril' },
      { value: 5, viewValue: 'Mayo' },
      { value: 6, viewValue: 'Junio' },
      { value: 7, viewValue: 'Julio' },
      { value: 8, viewValue: 'Agosto' },
      { value: 9, viewValue: 'Septiembre' },
      { value: 10, viewValue: 'Octubre' },
      { value: 11, viewValue: 'Noviembre' },
      { value: 12, viewValue: 'Diciembre' }
    ];
  }
  
  // Configurar los años disponibles
  setupYears(): void {
    for (let year = this.minYear; year <= this.maxYear; year++) {
      this.years.push(year);
    }
  }
  
  // Formatear año y mes como un entero YYYYMM
  formatYearMonth(year: number, month: number): number {
    if (!year || !month) return null;
    // Asegurarse de que el mes tenga dos dígitos
    const monthStr = month.toString().padStart(2, '0');
    return parseInt(`${year}${monthStr}`);
  }
  
  // Descomponer un valor YYYYMM en año y mes
  decomposeYearMonth(value: number): { year: number, month: number } | null {
    if (!value) return null;
    
    const valueStr = value.toString();
    if (valueStr.length !== 6) return null;
    
    const year = parseInt(valueStr.substring(0, 4));
    const month = parseInt(valueStr.substring(4));
    
    return { year, month };
  }
  
  // Seleccionar el periodo actual
  selectCurrentPeriod(): void {
    const now = new Date();
    this.form.setValue({
      year: now.getFullYear(),
      month: now.getMonth() + 1
    });
    this.form.markAsDirty();
    this.form.markAsTouched();
  }
  
  // Métodos para implementar ControlValueAccessor
  writeValue(value: number): void {
    const decomposed = this.decomposeYearMonth(value);
    if (decomposed) {
      this.form.setValue({
        year: decomposed.year,
        month: decomposed.month
      }, { emitEvent: false });
    } else {
      this.form.reset(null, { emitEvent: false });
    }
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }
  
  // Marcar como tocado cuando se interactúa con el control
  onBlur(): void {
    this.onTouched();
  }
}
