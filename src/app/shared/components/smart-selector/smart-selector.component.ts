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
    MatTooltipModule
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

  @Output() addClick = new EventEmitter<void>();
  @Output() editClick = new EventEmitter<any>();

  searchControl = new FormControl('');
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
      this.updateMode();
      this.setupAutocompleteFilter();
      // If we have a value, update the display text for autocomplete
      if (this.selectedValue !== null && this.isAutocomplete) {
        this.updateDisplayText();
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
        const filterText = typeof value === 'string' ? value : '';
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
    if (found) {
      this.searchControl.setValue(found.label, { emitEvent: false });
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
    const currentText = this.searchControl.value;
    if (typeof currentText === 'string') {
      const found = this.options.find(o => o.label.toLowerCase() === currentText.toLowerCase());
      if (found) {
        this.selectedValue = found.value;
        this.onChange(this.selectedValue);
      } else if (currentText === '') {
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
