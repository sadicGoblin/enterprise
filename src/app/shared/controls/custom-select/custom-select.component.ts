import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';

// Import the service for API calls - use the relative path based on project structure
import { SubParametroService } from '../../../domains/check-list/services/sub-parametro.service';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  idSubParam?: number; // Include IdSubParam for API integrations
}

// Define parameter types as constants for API calls
export enum ParameterType {
  NONE = 'none',
  CARGO = 'cargo',          // idEnt = 15
  TIPO_ACCESO = 'tipo_acceso', // idEnt = 16
  EMPRESA = 'empresa'        // idEnt = 17
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor, OnInit {
  @Input() options: SelectOption[] = [];
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input() errorMessage: string = '';
  
  // New input to determine if component should load data from API
  @Input() parameterType: ParameterType = ParameterType.NONE;
  @Input() loadFromApi: boolean = false;
  
  @Output() selectionChange = new EventEmitter<any>();
  @Output() optionsLoaded = new EventEmitter<SelectOption[]>();
  
  value: any;
  isDisabled: boolean = false;
  touched: boolean = false;
  isLoading: boolean = false;
  hasError: boolean = false;
  apiErrorMessage: string = '';
  
  constructor(private subParametroService: SubParametroService) {}

  ngOnInit(): void {
    // If loadFromApi is true and a valid parameterType is provided, fetch options from API
    if (this.loadFromApi && this.parameterType !== ParameterType.NONE) {
      this.loadOptionsFromApi();
    }
  }

  /**
   * Load options from API based on parameterType
   */
  loadOptionsFromApi(): void {
    this.isLoading = true;
    this.hasError = false;
    console.log(`CustomSelect: Loading options for ${this.parameterType} from API...`);
    
    let apiCall;
    
    // Select the appropriate API call based on parameterType
    switch(this.parameterType) {
      case ParameterType.CARGO:
        apiCall = this.subParametroService.getCargos();
        break;
      case ParameterType.TIPO_ACCESO:
        apiCall = this.subParametroService.getTipoAccesos();
        break;
      case ParameterType.EMPRESA:
        apiCall = this.subParametroService.getEmpresas();
        break;
      default:
        console.error('Invalid parameter type:', this.parameterType);
        this.hasError = true;
        this.apiErrorMessage = 'Tipo de parámetro inválido';
        this.isLoading = false;
        return;
    }
    
    // Execute the API call
    apiCall.pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data) => {
        this.options = data;
        console.log(`CustomSelect: Received ${data.length} options for ${this.parameterType}:`, data);
        
        // If we have options and no value is set yet, select the first one by default
        if (this.options.length > 0 && this.value === undefined) {
          this.value = this.options[0].value;
          this.onChange(this.value);
        }
        
        // Emit that options have been loaded
        this.optionsLoaded.emit(this.options);
      },
      error: (error) => {
        console.error(`CustomSelect: Error loading ${this.parameterType} options:`, error);
        this.hasError = true;
        this.apiErrorMessage = `Error al cargar opciones de ${this.label}`;
      }
    });
  }

  // ControlValueAccessor methods
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onSelectionChange(value: any): void {
    this.markAsTouched();
    this.onChange(value);
    
    console.log('[CustomSelect] Selection changed to value:', value);
    console.log('[CustomSelect] Available options:', this.options);
    
    // Find the selected option to get the full object with idSubParam
    const selectedOption = this.options.find(option => option.value === value);
    
    console.log('[CustomSelect] Found selected option object:', selectedOption);
    
    // Emit the full option object
    this.selectionChange.emit(selectedOption);
  }

  markAsTouched(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
  }

  compareWith(option1: any, option2: any): boolean {
    // Handle different types of values (objects, primitives)
    if (option1 && option2) {
      if (typeof option1 === 'object' && typeof option2 === 'object') {
        return option1.value === option2.value;
      }
      return option1 === option2;
    }
    return option1 === option2;
  }
}
