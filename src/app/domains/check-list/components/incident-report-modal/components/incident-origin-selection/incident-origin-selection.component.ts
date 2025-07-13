import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProxyService } from '../../../../../../core/services/proxy.service';

/**
 * Interfaz para las opciones de selección
 */
interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-incident-origin-selection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './incident-origin-selection.component.html',
  styleUrls: ['./incident-origin-selection.component.scss']
})
export class IncidentOriginSelectionComponent implements OnInit {
  
  /**
   * Configuración de la API para los select
   */
  // Endpoint API común
  apiEndpoint = '/ws/SubParametrosSvcImpl.php';
  
  // Request bodies para cada categoría
  trabajadoresRequestBody = {
    "caso": "SubParametroConsulta",
    "idEnt": 35
  };
  
  equiposFijosRequestBody = {
    "caso": "SubParametroConsulta",
    "idEnt": 36
  };
  
  edificiosRequestBody = {
    "caso": "SubParametroConsulta",
    "idEnt": 37
  };
  
  vehiculosRequestBody = {
    "caso": "SubParametroConsulta",
    "idEnt": 38
  };
  
  ambientalesRequestBody = {
    "caso": "SubParametroConsulta",
    "idEnt": 39
  };
  
  interesadosRequestBody = {
    "caso": "SubParametroConsulta",
    "idEnt": 40
  };
  
  // Arrays de opciones para los selects
  trabajadoresOptions: SelectOption[] = [];
  equiposFijosOptions: SelectOption[] = [];
  edificiosOptions: SelectOption[] = [];
  vehiculosOptions: SelectOption[] = [];
  ambientalesOptions: SelectOption[] = [];
  interesadosOptions: SelectOption[] = [];
  
  // Diccionario para mapear cada categoría con su array de opciones y request body
  categoryConfig: {[key: string]: {options: SelectOption[], requestBody: any}} = {};
  
  /**
   * Estados para los selects (mantenido por compatibilidad con plantillas)
   */
  isLoading = {
    trabajadores: false,
    equiposFijos: false,
    edificios: false,
    vehiculos: false,
    ambientales: false,
    interesados: false
  };

  /**
   * Formulario para la selección de origen
   */
  origenForm = new FormGroup({
    // Selects para cada categoría
    trabajadores: new FormControl([]),
    equiposFijos: new FormControl([]),
    edificios: new FormControl([]),
    vehiculos: new FormControl([]),
    ambientales: new FormControl([]),
    interesados: new FormControl('')
  });

  /**
   * Campos de origen seleccionados
   */
  selectedOrigins: {[key: string]: boolean} = {
    trabajadores: false,
    equiposFijos: false,
    edificios: false,
    vehiculos: false,
    ambientales: false,
    interesados: false
  };

  /**
   * Indicador si el formulario tiene selecciones
   */
  hasSelections = false;

  constructor(private proxyService: ProxyService) {}
  
  /**
   * Inicializa los listeners para los cambios en el formulario
   */
  initFormListeners(): void {
    // Escuchar cambios en cada campo de origen para actualizar selectedOrigins
    Object.keys(this.selectedOrigins).forEach(key => {
      this.origenForm.get(key)?.valueChanges.subscribe(value => {
        // Marcar como seleccionado si hay valores (interesados es un valor único, no un array)
        if (key === 'interesados') {
          this.selectedOrigins[key] = !!value; // Verdadero si hay un valor no nulo/vacío
        } else {
          this.selectedOrigins[key] = Array.isArray(value) && value.length > 0;
        }
        
        // Verificar si hay alguna selección en el formulario
        this.updateHasSelections();
      });
    });
  }
  
  /**
   * Actualiza el indicador de si hay selecciones en el formulario
   */
  updateHasSelections(): void {
    // Comprobar si hay al menos una categoría con valores seleccionados
    this.hasSelections = Object.values(this.selectedOrigins).some(selected => selected === true);
  }

  ngOnInit(): void {
    // Inicializar los listeners para cambios en el formulario
    this.initFormListeners();
    
    // Configurar el mapeo de categorías para facilitar la carga
    this.configureCategories();
    
    // Cargar las opciones para cada categoría
    this.loadOptions('trabajadores');
    this.loadOptions('equiposFijos');
    this.loadOptions('edificios');
    this.loadOptions('vehiculos');
    this.loadOptions('ambientales');
    this.loadOptions('interesados');
  }
  
  /**
   * Configura el mapeo de categorías con sus opciones y request body
   */
  configureCategories(): void {
    this.categoryConfig = {
      trabajadores: {
        options: this.trabajadoresOptions,
        requestBody: this.trabajadoresRequestBody
      },
      equiposFijos: {
        options: this.equiposFijosOptions,
        requestBody: this.equiposFijosRequestBody
      },
      edificios: {
        options: this.edificiosOptions,
        requestBody: this.edificiosRequestBody
      },
      vehiculos: {
        options: this.vehiculosOptions,
        requestBody: this.vehiculosRequestBody
      },
      ambientales: {
        options: this.ambientalesOptions,
        requestBody: this.ambientalesRequestBody
      },
      interesados: {
        options: this.interesadosOptions,
        requestBody: this.interesadosRequestBody
      }
    };
  }
  
  /**
   * Devuelve los datos seleccionados para el origen del incidente
   * Incluye tanto los IDs seleccionados como sus etiquetas
   */
  getOriginData() {
    // Obtener las opciones seleccionadas por categoría (IDs)
    const categorias = {
      A_TRABAJADORES: this.origenForm.get('trabajadores')?.value || [],
      B_EQUIPOS_FIJOS: this.origenForm.get('equiposFijos')?.value || [],
      C_EDIFICIOS: this.origenForm.get('edificios')?.value || [],
      D_VEHICULOS: this.origenForm.get('vehiculos')?.value || [],
      E_AMBIENTALES: this.origenForm.get('ambientales')?.value || []
    };
    
    // Obtener las etiquetas (textos) de las opciones seleccionadas
    const categoriaTextos = {
      A_TRABAJADORES: this.getSelectedLabels('trabajadores'),
      B_EQUIPOS_FIJOS: this.getSelectedLabels('equiposFijos'),
      C_EDIFICIOS: this.getSelectedLabels('edificios'),
      D_VEHICULOS: this.getSelectedLabels('vehiculos'),
      E_AMBIENTALES: this.getSelectedLabels('ambientales')
    };
    
    const partesInteresadas = this.origenForm.get('interesados')?.value || [];
    // Obtener la etiqueta de la parte interesada seleccionada
    const partesInteresadasTexto = this.getSingleSelectedLabel('interesados');
    
    return {
      categorias, // IDs seleccionados
      categoriaTextos, // Etiquetas de los IDs seleccionados
      partesInteresadas,
      partesInteresadasTexto,
      accion: {
        tipo: this.origenForm.get('accionRealizar')?.value || '',
        tipo2: this.origenForm.get('accionRealizar2')?.value || '',
        descripcion: this.origenForm.get('descripcionAccion')?.value || ''
      }
    };
  }
  
  /**
   * Obtiene las etiquetas (labels) de las opciones seleccionadas para una categoría
   * @param fieldName Nombre del campo de formulario
   */
  private getSelectedLabels(fieldName: string): string[] {
    const selectedValues = this.origenForm.get(fieldName)?.value || [];
    const optionsArray = this.getCategoryOptions(fieldName);
    
    if (!Array.isArray(selectedValues) || !optionsArray) {
      return [];
    }
    
    // Filtra las opciones que están seleccionadas y extrae sus labels
    return selectedValues
      .map(value => {
        const option = optionsArray.find(opt => opt.value === value);
        return option ? option.label : '';
      })
      .filter(label => !!label);
  }
  
  /**
   * Obtiene la etiqueta (label) de una opción seleccionada para campos de selección única
   * @param fieldName Nombre del campo de formulario
   */
  private getSingleSelectedLabel(fieldName: string): string {
    const selectedValue = this.origenForm.get(fieldName)?.value;
    const optionsArray = this.getCategoryOptions(fieldName);
    
    if (!selectedValue || !optionsArray) {
      return '';
    }
    
    const option = optionsArray.find(opt => opt.value === selectedValue);
    return option ? option.label : '';
  }
  
  /**
   * Obtiene el array de opciones para una categoría
   * @param category Nombre de la categoría
   */
  private getCategoryOptions(category: string): SelectOption[] {
    switch (category) {
      case 'trabajadores':
        return this.trabajadoresOptions;
      case 'equiposFijos':
        return this.equiposFijosOptions;
      case 'edificios':
        return this.edificiosOptions;
      case 'vehiculos':
        return this.vehiculosOptions;
      case 'ambientales':
        return this.ambientalesOptions;
      case 'interesados':
        return this.interesadosOptions;
      default:
        return [];
    }
  }
  
  /**
   * Verifica si el formulario de origen es válido
   */
  isFormValid(): boolean {
    // Verificar que al menos una opción está seleccionada en alguna categoría
    const tieneSeleccion = this.hasAnySelection();
    // const tieneDescripcion = !!this.origenForm.get('descripcionAccion')?.value;
    
    return tieneSeleccion;
  }
  
  /**
   * Verifica si hay al menos una selección en cualquier categoría
   */
  private hasAnySelection(): boolean {
    // Verificar todas las categorías de checkboxes
    for (const key in this.origenForm.controls) {
      if (key !== 'accionRealizar' && key !== 'accionRealizar2' && key !== 'descripcionAccion') {
        if (this.origenForm.get(key)?.value.length > 0) {
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Carga las opciones para un select desde la API
   */
  loadOptions(category: string): void {
    if (!this.categoryConfig[category]) {
      console.error(`Categoría no configurada: ${category}`);
      return;
    }
    
    // Establecer estado de carga
    this.isLoading[category as keyof typeof this.isLoading] = true;
    
    // Obtener el request body de la configuración
    const requestBody = this.categoryConfig[category].requestBody;
    
    // Llamar a la API
    this.proxyService.post(this.apiEndpoint, requestBody).subscribe({
      next: (response: any) => {
        if (response.code === 200 && response.data) {
          // Mapear la respuesta de la API al formato que necesitamos
          const options = response.data.map((item: any) => ({
            value: item.IdSubParam, // Usar IdSubParam como value
            label: item.Nombre,     // Usar Nombre como label
            originalItem: item      // Guardar item original para referencia
          }));
          
          // Actualizar las opciones
          // Necesitamos acceder directamente al array que corresponde a esta categoría
          switch (category) {
            case 'trabajadores':
              this.trabajadoresOptions = options;
              break;
            case 'equiposFijos':
              this.equiposFijosOptions = options;
              break;
            case 'edificios':
              this.edificiosOptions = options;
              break;
            case 'vehiculos':
              this.vehiculosOptions = options;
              break;
            case 'ambientales':
              this.ambientalesOptions = options;
              break;
            case 'interesados':
              this.interesadosOptions = options;
              break;
          }
        } else {
          console.error(`Error en la respuesta de la API para ${category}:`, response);
        }
        
        // Finalizar estado de carga
        this.isLoading[category as keyof typeof this.isLoading] = false;
      },
      error: (error) => {
        console.error(`Error al cargar opciones para ${category}:`, error);
        this.isLoading[category as keyof typeof this.isLoading] = false;
      }
    });
  }
}
