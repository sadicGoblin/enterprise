import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, map, startWith } from 'rxjs';

export interface SmartSelectorOption {
  value: any;
  label: string;
  sublabel?: string;
}

@Component({
  selector: 'app-smart-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SmartSelectorComponent),
      multi: true
    }
  ],
  templateUrl: './smart-selector.component.html',
  styleUrl: './smart-selector.component.scss'
})
export class SmartSelectorComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() label = '';
  @Input() options: SmartSelectorOption[] = [];
  @Input() placeholder = 'Seleccione...';
  @Input() required = false;
  @Input() showAdd = true;
  @Input() showEdit = false;
  @Input() threshold = 10;
  @Input() disabled = false;
  @Input() errorMessage = '';
  @Input() loading = false;

  @Output() addClick = new EventEmitter<void>();
  @Output() editClick = new EventEmitter<any>();

  searchControl = new FormControl<string | SmartSelectorOption>('');
  filteredOptions$!: Observable<SmartSelectorOption[]>;
  isAutocomplete = false;

  selectedValue: any = null;
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.updateMode();
    this.setupAutocompleteFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      console.log(`[Selector-${this.label}] ngOnChanges: ${this.options.length} opciones, selectedValue=${this.selectedValue}`);
      
      const previousValue = this.selectedValue;
      this.updateMode();
      this.setupAutocompleteFilter();
      
      // Preservar el valor seleccionado cuando las opciones cambian
      if (previousValue !== null && previousValue !== undefined) {
        const stillExists = this.options.some(o => o.value === previousValue);
        console.log(`[Selector-${this.label}] Valor ${previousValue} ${stillExists ? 'EXISTE' : 'NO EXISTE'} en nuevas opciones`);
        
        if (stillExists) {
          this.selectedValue = previousValue;
          // SIEMPRE actualizar display text si es autocomplete, sin importar cómo llegó el valor
          if (this.isAutocomplete) {
            this.updateDisplayText();
            console.log(`[Selector-${this.label}] Display text actualizado para valor ${previousValue}`);
          }
        }
      }
    }
  }

  private updateMode(): void {
    this.isAutocomplete = this.options.length > this.threshold;
  }

  private setupAutocompleteFilter(): void {
    this.filteredOptions$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        // Si es un objeto SmartSelectorOption, usar su label para filtrar
        const filterText = typeof value === 'string' ? value : (value?.label || '');
        return this._filterOptions(filterText);
      })
    );
  }

  private _filterOptions(filterText: string): SmartSelectorOption[] {
    if (!filterText) return this.options;
    const lower = filterText.toLowerCase();
    return this.options.filter(opt =>
      opt.label.toLowerCase().includes(lower) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(lower))
    );
  }

  private updateDisplayText(): void {
    const found = this.options.find(o => o.value === this.selectedValue);
    console.log(`[Selector-${this.label}] updateDisplayText: buscando value=${this.selectedValue}, found=${found ? found.label : 'NO'}`);
    if (found) {
      // Setear el objeto completo, no solo el label
      this.searchControl.setValue(found, { emitEvent: false });
      console.log(`[Selector-${this.label}] searchControl.setValue(objeto completo: "${found.label}")`);
    }
  }

  onAutocompleteSelected(option: SmartSelectorOption): void {
    this.selectedValue = option.value;
    this.onChange(this.selectedValue);
    this.onTouched();
  }

  onSelectChange(value: any): void {
    this.selectedValue = value;
    this.onChange(this.selectedValue);
    this.onTouched();
  }

  onAutocompleteClosed(): void {
    // If user typed something but didn't select, revert to last valid value
    const currentValue = this.searchControl.value;
    
    // Si es un objeto, ya está seleccionado correctamente
    if (typeof currentValue === 'object' && currentValue !== null) {
      return;
    }
    
    // Si es string, intentar encontrar coincidencia
    if (typeof currentValue === 'string') {
      const found = this.options.find(o => o.label.toLowerCase() === currentValue.toLowerCase());
      if (found) {
        this.selectedValue = found.value;
        this.onChange(this.selectedValue);
      } else if (currentValue === '') {
        this.selectedValue = null;
        this.onChange(null);
      } else {
        this.updateDisplayText();
      }
    }
    this.onTouched();
  }

  clearAutocomplete(): void {
    this.searchControl.setValue('');
    this.selectedValue = null;
    this.onChange(null);
    this.onTouched();
  }

  onAddClicked(event: Event): void {
    event.stopPropagation();
    this.addClick.emit();
  }

  onEditClicked(event: Event): void {
    event.stopPropagation();
    this.editClick.emit(this.selectedValue);
  }

  get hasValue(): boolean {
    return this.selectedValue !== null && this.selectedValue !== undefined && this.selectedValue !== '';
  }

  displayFn(option: SmartSelectorOption): string {
    return option ? option.label : '';
  }

  // ControlValueAccessor
  writeValue(value: any): void {
    const found = value !== null && value !== undefined ? this.options.find(o => o.value === value) : null;
    console.log(`[Selector-${this.label}] writeValue(${value}): ${this.options.length} opts, ${this.isAutocomplete ? 'autocomplete' : 'select'}, ${found ? `FOUND (${found.label})` : 'NOT FOUND'}`);
    
    this.selectedValue = value;
    
    if (this.isAutocomplete) {
      this.updateDisplayText();
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }
}
