import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { ProxyService } from '../../../../../../core/services/proxy.service';
import { CustomSelectComponent, ParameterType } from '../../../../../../shared/controls/custom-select/custom-select.component';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-incident-validation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    CustomSelectComponent
  ],
  templateUrl: './incident-validation.component.html',
  styleUrls: ['./incident-validation.component.scss']
})
export class IncidentValidationComponent implements OnInit {
  // Referencia al enum ParameterType para el template
  parameterType = ParameterType;
  
  // Formulario para validación
  validationForm = new FormGroup({
    comunicadoA: new FormControl<string[]>([], Validators.required),
    comunicadoPor: new FormControl('', Validators.required)
  });
  
  // Lista de archivos adjuntos seleccionados
  selectedFiles: File[] = [];

  // API endpoint para usuarios
  usuariosApiEndpoint = '/ws/UsuarioSvcImpl.php';
  
  // Request body para la API de usuarios
  usuariosApiRequestBody = {
    "caso": "Consultas",
    "idUsuario": 0,
    "usuario": null
  };

  // Opciones para selección de personas
  personasOptions: {value: any, label: string}[] = [];

  // Estado de carga
  isLoading = {
    comunicadoA: false,
    comunicadoPor: false
  };

  constructor(private proxyService: ProxyService) { }

  ngOnInit(): void {
    // Cargar datos de usuarios desde la API
    this.loadOptions();
  }

  // Método para cargar las opciones de usuarios para comunicadoA desde la API
  private loadOptions(): void {
    // Establecer estado de carga sólo para comunicadoA
    // (comunicadoPor es manejado por el componente app-custom-select)
    this.isLoading.comunicadoA = true;
    
    // Llamar a la API para obtener los usuarios
    this.proxyService.post(environment.apiBaseUrl + this.usuariosApiEndpoint, this.usuariosApiRequestBody).subscribe({
      next: (response: any) => {
        // Verificar si la respuesta es válida
        if (response && response.code === 200 && response.data) {
          // Mapear la respuesta a las opciones que necesitamos
          this.personasOptions = response.data.map((item: any) => ({
            value: item.IdUsuario, // Usar IdUsuario como valor
            label: item.Nombre     // Usar Nombre como etiqueta
          }));
        } else {
          console.error('Error en formato de respuesta de API:', response);
          // En caso de error, usar datos de ejemplo como fallback
          this.personasOptions = [
            { value: 'persona1', label: 'RAÚL ALBORNOZ' },
            { value: 'persona2', label: 'MATÍAS HERNÁNDEZ' }
          ];
        }
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        // En caso de error, usar datos de ejemplo como fallback
        this.personasOptions = [
          { value: 'persona1', label: 'RAÚL ALBORNOZ' },
          { value: 'persona2', label: 'MATÍAS HERNÁNDEZ' }
        ];
      },
      complete: () => {
        // Completar la carga
        this.isLoading.comunicadoA = false;
      }
    });
  }

  // Obtener los datos del formulario de validación
  getValidationData() {
    if (!this.validationForm.valid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.validationForm.controls).forEach(key => {
        const control = this.validationForm.get(key);
        control?.markAsTouched();
      });
      return null;
    }
    
    // Obtener las personas comunicadas por sus nombres (no solo IDs)
    const comunicadoA = this.validationForm.get('comunicadoA')?.value || [];
    const comunicadoATextos: string[] = [];
    
    // Obtener los textos de cada opción seleccionada
    comunicadoA.forEach((id: any) => {
      const persona = this.personasOptions.find(p => p.value == id);
      if (persona) {
        comunicadoATextos.push(persona.label);
      }
    });
    
    // Obtener el texto del comunicado por
    const comunicadoPorId = this.validationForm.get('comunicadoPor')?.value;
    const comunicadoPorPersona = this.personasOptions.find(p => p.value == comunicadoPorId);
    const comunicadoPorTexto = comunicadoPorPersona ? comunicadoPorPersona.label : '';
    
    // Incluir los datos del formulario, textos y los archivos adjuntos
    return {
      ...this.validationForm.value,
      comunicadoATextos: comunicadoATextos,
      comunicadoPorTexto: comunicadoPorTexto,
      adjuntos: this.selectedFiles
    };
  }
  
  // Método para manejar la selección de archivos
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      // Convertir FileList a Array y agregar a selectedFiles
      const newFiles = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
    }
  }
  
  // Método para eliminar un archivo de la lista
  removeFile(index: number) {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
  }
}
