import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs'; // Add Observable import
import { finalize, map } from 'rxjs/operators'; // Ensure map is imported

// Import the service for API calls - use the relative path based on project structure
import { SubParametroService } from '../../../domains/check-list/services/sub-parametro.service';
import { ProxyService } from '../../../core/services/proxy.service'; // Import ProxyService

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
  EMPRESA = 'empresa',        // idEnt = 17
  OBRA = 'obra',             // Custom API call for projects/obras
  CUSTOM_API = 'custom_api'  // Generic custom API call for any endpoint
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

  // Inputs for custom API calls when parameterType is OBRA or a similar generic type
  @Input() customApiEndpoint?: string;
  @Input() customApiRequestBody?: any;
  @Input() customOptionValueKey: string = 'value'; // Default, parent can override
  @Input() customOptionLabelKey: string = 'label'; // Default, parent can override
  
  @Output() selectionChange = new EventEmitter<any>();
  @Output() optionsLoaded = new EventEmitter<SelectOption[]>();
  
  value: any;
  isDisabled: boolean = false;
  touched: boolean = false;
  isLoading: boolean = false;
  hasError: boolean = false;
  apiErrorMessage: string = '';
  
  constructor(
    private subParametroService: SubParametroService,
    private proxyService: ProxyService // Inject ProxyService
  ) {}

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
    // console.log(`CustomSelect: Loading options for ${this.parameterType} from API...`);
    
    let apiCall: Observable<SelectOption[]>; // Explicitly type apiCall
    
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
      case ParameterType.OBRA:
      case ParameterType.CUSTOM_API:
        if (!this.customApiEndpoint || !this.customApiRequestBody) {
          console.error(`CustomSelect: customApiEndpoint and customApiRequestBody are required for ${this.parameterType}`);
          this.hasError = true;
          this.apiErrorMessage = 'Configuración de API personalizada incompleta.';
          this.isLoading = false;
          return;
        }
        // console.log(`CustomSelect: Calling custom API for ${this.parameterType} at ${this.customApiEndpoint} with body:`, this.customApiRequestBody);
        // Directly use proxyService for the custom call
        apiCall = this.proxyService.post<any>(this.customApiEndpoint, this.customApiRequestBody).pipe(
          map((response: any): SelectOption[] => { // Explicit return type for map callback
            if (response && response.success && response.data && Array.isArray(response.data)) {
              console.log("API ", this.customApiEndpoint)
              console.log("Body ", this.customApiRequestBody)
              console.log(`CustomSelect: API completa para ${this.label}:`, response);
              console.log(`CustomSelect: Primer elemento de datos para ${this.label}:`, response.data[0]);
              console.log(`CustomSelect: Buscando valores usando las claves [${this.customOptionValueKey}] y [${this.customOptionLabelKey}]`);
              
              // Detectar la estructura real de los datos para debugging
              if (response.data.length > 0) {
                const firstItem = response.data[0];
                const availableKeys = Object.keys(firstItem);
                console.log(`CustomSelect: Claves disponibles en los datos: ${availableKeys.join(', ')}`);
              }
              
              return response.data.map((item: any) => {
                // Buscar la propiedad independiente de mayúsculas/minúsculas
                let value: any = null;
                let label: string = '';
                
                // Intentar encontrar la clave en el objeto independiente de la capitalización
                for (const key of Object.keys(item)) {
                  if (key.toLowerCase() === this.customOptionValueKey.toLowerCase()) {
                    value = item[key];
                    break;
                  }
                }
                
                // Intentar encontrar la etiqueta
                for (const key of Object.keys(item)) {
                  if (key.toLowerCase() === this.customOptionLabelKey.toLowerCase()) {
                    label = item[key];
                    break;
                  }
                }
                
                console.log(`CustomSelect: Mapeando item con ${this.customOptionValueKey}=${value}, ${this.customOptionLabelKey}=${label}`);
                
                if (value === undefined || value === null) {
                  // console.warn(`CustomSelect: Valor no encontrado para ${this.label} usando clave ${this.customOptionValueKey}`, item);
                  // Intento de recuperación - usar IdSubParam o IdDet si están disponibles
                  if (item.IdSubParam !== undefined) {
                    value = item.IdSubParam;
                    // console.log(`CustomSelect: Recuperando con IdSubParam=${value}`);
                  } else if (item.IdDet !== undefined) {
                    value = item.IdDet;
                    // console.log(`CustomSelect: Recuperando con IdDet=${value}`);
                  }
                }
                
                return {
                  value: value,
                  label: label,
                  // Guardar propiedades específicas que necesitamos para el mapeo
                  idSubParam: item.IdSubParam, 
                  idDet: item.IdDet,
                  // Guardar el item original para debugging y referencia
                  originalItem: item 
                } as any;
              });
            } else {
              console.error(`CustomSelect: Custom API response for ${this.parameterType} is not in the expected format or call failed.`, response);
              throw new Error(`Respuesta de API personalizada inválida para ${this.label}`);
            }
          })
        );
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
      next: (data: SelectOption[]) => { // Explicitly type data
        this.options = data;
        // console.log(`CustomSelect: Received ${data.length} options for ${this.parameterType}:`, data);
        
        // If we have options and no value is set yet, select the first one by default
        if (this.options.length > 0 && this.value === undefined) {
          this.value = this.options[0].value;
          this.onChange(this.value);
        }
        
        // Emit that options have been loaded
        this.optionsLoaded.emit(this.options);
      },
      error: (error: any) => { // Explicitly type error parameter
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
    
    // console.log('[CustomSelect] Selection changed to value:', value);
    // console.log('[CustomSelect] Available options:', this.options);
    
    // Find the selected option to get the full object with idSubParam
    const selectedOption = this.options.find(option => option.value === value);
    
    // console.log('[CustomSelect] Found selected option object:', selectedOption);
    
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
  
  /**
   * Public method to reload options from API
   * This is useful when the request body changes and we need to refresh the data
   */
  reloadOptions(): void {
    if (this.loadFromApi && this.parameterType !== ParameterType.NONE) {
      // console.log(`[CustomSelect] Reloading options for ${this.label} with request body:`, this.customApiRequestBody);
      // Reset any previous data to ensure loading state is visible
      this.options = [];
      this.isLoading = true;
      this.hasError = false;
      // Load new options
      this.loadOptionsFromApi();
    }
  }
}
