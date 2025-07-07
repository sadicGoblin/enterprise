import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CustomSelectComponent, SelectOption, ParameterType } from '../../../../../../../shared/controls/custom-select/custom-select.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subscription, catchError, finalize, map, of } from 'rxjs';
import { SharedDataService } from '../../../../../services/shared-data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProxyService } from '../../../../../../../core/services/proxy.service';

// Interfaces para respuestas de API
interface ApiActivityResponse {
  success: boolean;
  data: any[];
  msg?: string;
  message?: string;
}

// Interfaces para items de actividad
interface ActivityItem {
  id?: string | number;
  code: string;
  name: string;
  frequency: string;
  category: string;
  parameter: string;
  document: string;
  idAmbito: string;
  idFrequency: string;
  idCategory: string;
  idParameter: string;
  idDocument: string;
}

// Interfaces para los datos de referencia
interface FrequencyOption {
  id?: string | number;
  IdDet?: string | number;
  IdSubParam?: string | number;
  Nombre?: string;
  nombre?: string;
  [key: string]: any; // Para otras propiedades que pueda contener
}

interface CategoryOption {
  id?: string | number;
  IdDet?: string | number;
  IdSubParam?: string | number;
  Nombre?: string;
  nombre?: string;
  [key: string]: any;
}

interface ParameterOption {
  id?: string | number;
  idDetalle?: string | number;
  IdParametro?: string | number;
  idParametro?: string | number;
  Nombre?: string;
  nombre?: string;
  [key: string]: any;
}

interface DocumentOption {
  id?: string | number;
  idBiblioteca?: string | number;
  IdDocumento?: string | number;
  idDocumento?: string | number;
  Nombre?: string;
  nombre?: string;
  nombreArchivo?: string;
  [key: string]: any;
}



@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    CustomSelectComponent,
    ReactiveFormsModule
  ],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss']
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  @ViewChild('scopeSelect') scopeSelect!: CustomSelectComponent;
  // Parameter types enum for custom-select
  parameterTypes = ParameterType;
  
  // Document API configuration
  documentApiEndpoint = '/ws/BibliotecaSvcImpl.php';
  documentApiRequestBody = {
    "caso": "ConsultaSinDocumento",
    "idBiblioteca": 0
  };
  documentControl = new FormControl(null);
  selectedDocument: any = null;
  
  // Parameter API configuration - using custom API
  parameterApiEndpoint = '/ws/ParametrosSvcImpl.php';
  parameterApiRequestBody = {
    "caso": "DetalleConsulta",
    "idCab": 5
  };
  parameterControl = new FormControl(null);
  selectedParameter: any = null;
  
  // Category API configuration - using custom API
  categoryApiEndpoint = '/ws/SubParametrosSvcImpl.php';
  categoryApiRequestBody = {
    "caso": "SubParametroConsulta",
    "idEnt": 141
  };
  categoryControl = new FormControl(null);
  selectedCategory: any = null;
  
  // Frequency API configuration - using custom API
  frequencyApiEndpoint = '/ws/SubParametrosSvcImpl.php';
  frequencyApiRequestBody = {
    "caso": "SubParametroConsulta",
    "idEnt": 4
  };
  frequencyControl = new FormControl(null);
  selectedFrequency: any = null;
  
  // Scope API configuration - using custom API
  scopeApiEndpoint = '/ws/AmbitosSvcImpl.php';
  scopeApiRequestBody = {
    "caso": "ConsultaAmbitos",
    "idAmbito": 0,
    "nombre": null,
    "codigo": 0
  };
  scopeControl = new FormControl(null);
  selectedScopeOption: any = null;
  
  // Activities data
  activities: ActivityItem[] = [];
  displayedColumnsActivities: string[] = ['code', 'name', 'frequency', 'category', 'parameter', 'document', 'edit', 'delete'];
  isLoadingActivities = false;
  activityName = '';
  activityCode = '';
  searchActivityValue = '';
  currentEditingIndex: number | null = null;
  activityBeingEdited: boolean = false;
  activitiesByScope: Record<string, ActivityItem[]> = {};
  selectedScopeId: string | null = null;
  
  // Subscription para cambios de ámbitos
  private ambitosSubscription: Subscription | undefined;
  
  // Datos de referencia para mapear IDs a nombres
  private frequencyOptions: FrequencyOption[] = [];
  private categoryOptions: CategoryOption[] = [];
  private parameterOptions: ParameterOption[] = [];
  private documentOptions: DocumentOption[] = [];
  
  constructor(
    private proxyService: ProxyService,
    private sharedDataService: SharedDataService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    // Suscribirse a actualizaciones de ámbitos
    this.ambitosSubscription = this.sharedDataService.ambitosUpdated$.subscribe(() => {
      console.log('🔄 Recibida notificación de actualización de ámbitos en activities.component');
      this.refreshScopeOptions();
    });
    
    // Cargar datos de referencia para los mapeos
    this.loadReferenceData();
  }
  
  ngOnDestroy(): void {
    // Limpiar suscripciones al destruir el componente
    if (this.ambitosSubscription) {
      this.ambitosSubscription.unsubscribe();
    }
  }
  
  /**
   * Refresca las opciones del selector de ámbitos
   */
  refreshScopeOptions(): void {
    console.log('🔄 Refrescando opciones de ámbitos en activities.component');
    
    // Si tenemos un selector visible, forzar la recarga
    if (this.scopeSelect) {
      this.scopeSelect.reloadOptions();
      console.log('✅ Opciones de ámbitos actualizadas');
    } else {
      console.log('⚠️ No se encontró referencia al selector de ámbitos');
      
      // Si no hay referencia, podemos resetear el control y volver a cargar datos
      const currentValue = this.scopeControl.value;
      this.scopeControl.reset();
      
      // Si había un valor seleccionado, intentar mantenerlo
      if (currentValue) {
        setTimeout(() => {
          this.scopeControl.setValue(currentValue);
        }, 100);
      }
    }
  }
  
  /**
   * Handle document selection change from app-custom-select
   */
  onDocumentSelectionChange(selectedOption: SelectOption): void {
    if (selectedOption) {
      this.selectedDocument = {
        id: selectedOption.value,
        name: selectedOption.label
      };
    } else {
      this.selectedDocument = null;
    }
  }
  
  /**
   * Handle parameter selection change from app-custom-select
   */
  onParameterSelectionChange(selectedOption: SelectOption): void {
    if (selectedOption) {
      this.selectedParameter = {
        id: selectedOption.value,
        name: selectedOption.label
      };
    } else {
      this.selectedParameter = null;
    }
  }
  
  /**
   * Handle category selection change from app-custom-select
   */
  onCategorySelectionChange(selectedOption: SelectOption): void {
    if (selectedOption) {
      this.selectedCategory = {
        id: selectedOption.value,
        name: selectedOption.label
      };
    } else {
      this.selectedCategory = null;
    }
  }
  
  /**
   * Handle frequency selection change from app-custom-select
   */
  onFrequencySelectionChange(selectedOption: SelectOption): void {
    if (selectedOption) {
      this.selectedFrequency = {
        id: selectedOption.value,
        name: selectedOption.label
      };
    } else {
      this.selectedFrequency = null;
    }
  }
  
  /**
   * Handle scope selection change from app-custom-select
   */
  onScopeSelectionChange(selectedOption: SelectOption): void {
    if (!selectedOption) {
      this.selectedScopeId = null;
      this.activities = [];
      return;
    }
    
    const scopeId = selectedOption.value as string;
    this.selectedScopeId = scopeId;
    this.selectedScopeOption = {
      id: scopeId,
      name: selectedOption.label
    };
    
    this.loadActivitiesByScope(scopeId);
  }
  
  // La implementación de loadActivitiesByScope se ha movido más abajo en el código

  /**
   * Cargar datos de referencia para los mapeos
   */
  loadReferenceData(): void {
    // Cargar datos de frecuencia (periodicidad)
    this.proxyService.post<any>('/ws/SubParametrosSvcImpl.php', this.frequencyApiRequestBody)
      .pipe(
        map(response => {
          if (response && response.success && Array.isArray(response.data)) {
            // Asegurar que cada objeto tenga las propiedades correctas
            this.frequencyOptions = response.data.map((item: any): FrequencyOption => ({
              ...item,
              // Asegurar consistencia de propiedad de valor
              id: item.IdDet || item.IdSubParam || item.id,
              // Mantener propiedades originales para compatibilidad con diferentes métodos
              IdDet: item.IdDet || item.id,
              IdSubParam: item.IdSubParam || item.IdDet || item.id,
              Nombre: item.Nombre || item.nombre
            }));
            console.log('📚 Datos de frecuencia cargados:', this.frequencyOptions);
          }
          return response;
        }),
        catchError(error => {
          console.error('❌ Error al cargar datos de frecuencia:', error);
          return of(null);
        })
      ).subscribe();
    
    // Cargar datos de categoría
    this.proxyService.post<any>('/ws/SubParametrosSvcImpl.php', this.categoryApiRequestBody)
      .pipe(
        map(response => {
          if (response && response.success && Array.isArray(response.data)) {
            // Asegurar que cada objeto tenga las propiedades correctas
            this.categoryOptions = response.data.map((item: any): CategoryOption => ({
              ...item,
              // Asegurar consistencia de propiedad de valor
              id: item.IdDet || item.IdSubParam || item.id,
              // Mantener propiedades originales para compatibilidad con diferentes métodos
              IdDet: item.IdDet || item.id,
              IdSubParam: item.IdSubParam || item.IdDet || item.id,
              Nombre: item.Nombre || item.nombre
            }));
            console.log('📚 Datos de categoría cargados:', this.categoryOptions);
          }
          return response;
        }),
        catchError(error => {
          console.error('❌ Error al cargar datos de categoría:', error);
          return of(null);
        })
      ).subscribe();
    
    // Cargar datos de parámetro
    this.proxyService.post<any>('/ws/ParametrosSvcImpl.php', this.parameterApiRequestBody)
      .pipe(
        map(response => {
          if (response && response.success && Array.isArray(response.data)) {
            // Asegurar que cada objeto tenga la propiedad IdParametro que espera el selector
            this.parameterOptions = response.data.map((item: any): ParameterOption => ({
              ...item,
              // Asegurar que exista la propiedad que espera el selector
              IdParametro: item.idDetalle || item.IdParametro || item.idParametro || item.id,
              // Asegurar consistencia de nombres de propiedad
              id: item.idDetalle || item.IdParametro || item.idParametro || item.id,
              idDetalle: item.idDetalle || item.id,
              Nombre: item.nombre || item.Nombre
            }));
            console.log('📚 Datos de parámetro cargados y normalizados:', this.parameterOptions);
          }
          return response;
        }),
        catchError(error => {
          console.error('❌ Error al cargar datos de parámetro:', error);
          return of(null);
        })
      ).subscribe();
    
    // Cargar datos de documento
    this.proxyService.post<any>('/ws/BibliotecaSvcImpl.php', this.documentApiRequestBody)
      .pipe(
        map(response => {
          if (response && response.success && Array.isArray(response.data)) {
            // Asegurar que cada objeto tenga la propiedad IdDocumento que espera el selector
            this.documentOptions = response.data.map((item: any): DocumentOption => ({
              ...item,
              // Asegurar que exista la propiedad que espera el selector
              IdDocumento: item.idBiblioteca || item.IdDocumento || item.idDocumento || item.id,
              // Asegurar consistencia de nombres de propiedad
              id: item.idBiblioteca || item.IdDocumento || item.idDocumento || item.id,
              idBiblioteca: item.idBiblioteca || item.id,
              Nombre: item.nombreArchivo || item.Nombre || item.nombre
            }));
            console.log('📚 Datos de documento cargados y normalizados:', this.documentOptions);
          }
          return response;
        }),
        catchError(error => {
          console.error('❌ Error al cargar datos de documento:', error);
          return of(null);
        })
      ).subscribe();
  }

  /**
   * Obtener el nombre de la frecuencia según su ID
   */
  getFrequencyNameById(id: string): string {
    // Si el id es 0 o null, retornamos un texto descriptivo
    if (!id || id === '0') {
      return 'Sin periodicidad';
    }
    
    const frequency = this.frequencyOptions.find(option => option.IdDet === id || option.IdSubParam === id);
    return frequency ? (frequency.Nombre || frequency.nombre || `Periodicidad ${id}`) : `Periodicidad ${id}`;
  }

  /**
   * Obtener el nombre de la categoría según su ID
   */
  getCategoryNameById(id: string): string {
    // Si el id es 0 o null, retornamos un texto descriptivo
    if (!id || id === '0') {
      return 'Sin categoría';
    }
    
    const category = this.categoryOptions.find(option => option.IdDet === id || option.IdSubParam === id);
    return category ? (category.Nombre || category.nombre || `Categoría ${id}`) : `Categoría ${id}`;
  }

  /**
   * Obtener el nombre del parámetro según su ID
   */
  getParameterNameById(id: string): string {
    // Si el id es 0 o null, retornamos un texto descriptivo
    if (!id || id === '0') {
      return 'Sin parámetro asociado';
    }
    
    // Buscar usando la propiedad IdDet que es donde vienen los id como "102", "210", etc.
    const parameter = this.parameterOptions.find(option => 
      option["IdDet"] === id || 
      option["IdParametro"] === id || 
      option.idParametro === id || 
      option.idDetalle === id
    );
    
    console.log(`🔍 Buscando parámetro con id=${id}, encontrado:`, parameter);
    return parameter ? (parameter.Nombre || parameter.nombre || `Parámetro ${id}`) : `Parámetro ${id}`;
  }

  /**
   * Obtener el nombre del documento según su ID
   */
  getDocumentNameById(id: string): string {
    // Si el id es 0 o null, retornamos un texto descriptivo
    if (!id || id === '0') {
      return 'No Asociado';
    }
    
    // Buscar usando la propiedad IdDocumento como se define en el custom-select
    const document = this.documentOptions.find(option => 
      option.IdDocumento === id || 
      option.idDocumento === id || 
      option.idBiblioteca === id
    );
    
    console.log(`🔍 Buscando documento con id=${id}, encontrado:`, document);
    return document ? (document.Nombre || document.nombreArchivo || `Documento ${id}`) : `Documento ${id}`;
  }

  /**
   * Load activities by scope ID
   */
  loadActivitiesByScope(scopeId: string): void {
    if (!scopeId) {
      this.activities = [];
      return;
    }
    
    if (this.activitiesByScope[scopeId]) {
      this.activities = [...this.activitiesByScope[scopeId]];
      return;
    }
    
    this.isLoadingActivities = true;
    
    // Preparar el payload para consultar actividades por ámbito
    const payload = {
      "caso": "ConsultaActividades",
      "idActividades": 0,
      "idAmbito": parseInt(scopeId, 10),
      "codigo": 0,
      "nombre": null,
      "idPeriocidad": 0,
      "idCategoriaActividad": 0,
      "idParametroAsociado": 0,
      "idBiblioteca": 0
    };
    
    console.log('🔍 Consultando actividades para el ámbito:', scopeId, 'con payload:', payload);
    
    this.proxyService.post<ApiActivityResponse>('/ws/AmbitosSvcImpl.php', payload)
      .pipe(
        map(response => {
          console.log('📥 Respuesta de consulta de actividades:', response);
          if (response && response.success && Array.isArray(response.data)) {
            const activities = response.data.map(item => {
              // Mapear los IDs a sus nombres usando los métodos auxiliares
              const frequencyName = this.getFrequencyNameById(item.idPeriocidad);
              const categoryName = this.getCategoryNameById(item.idCategoriaActividad);
              const parameterName = this.getParameterNameById(item.idParametroAsociado);
              const documentName = this.getDocumentNameById(item.idBiblioteca);
              
              return {
                id: item.idActividades,
                code: item.codigo,
                name: item.nombre,
                frequency: frequencyName,  // Nombre en lugar de ID
                category: categoryName,    // Nombre en lugar de ID
                parameter: parameterName,  // Nombre en lugar de ID
                document: documentName,    // Nombre en lugar de ID
                idAmbito: item.idAmbito,
                idFrequency: item.idPeriocidad,
                idCategory: item.idCategoriaActividad,
                idParameter: item.idParametroAsociado,
                idDocument: item.idBiblioteca
              };
            });
            
            console.log(`✅ ${activities.length} actividades procesadas para el ámbito ${scopeId}:`, activities);
            return activities;
          } else {
            console.warn('⚠️ No se encontraron actividades para este ámbito o hay un error en la respuesta');
            return [];
          }
        }),
        catchError(error => {
          console.error('❌ Error al cargar actividades:', error);
          this.snackBar.open(
            `Error al cargar actividades: ${error.message || 'Error de conexión'}`,
            'Cerrar',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
          return of([]);
        }),
        finalize(() => {
          this.isLoadingActivities = false;
        })
      )
      .subscribe(activities => {
        // Guardar en caché y actualizar la lista actual
        this.activitiesByScope[scopeId] = activities;
        this.activities = [...activities];
      });
  }

  /**
   * Add or update an activity
   */
  addActivity(): void {
    // Validar que todos los campos requeridos estén completos
    if (!this.selectedScopeId || !this.activityCode || !this.activityName) {
      this.snackBar.open('Faltan campos requeridos: Ámbito, Código y Nombre son obligatorios', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      console.error('Missing required fields for activity');
      return;
    }

    if (!this.selectedFrequency || !this.selectedCategory || !this.selectedParameter || !this.selectedDocument) {
      this.snackBar.open('Faltan campos requeridos: Frecuencia, Categoría, Parámetro y Documento son obligatorios', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      console.error('Missing required fields for activity');
      return;
    }
  
    // Datos para mostrar en la interfaz
    const newActivity: ActivityItem = {
      code: this.activityCode,
      name: this.activityName,
      frequency: this.selectedFrequency ? this.selectedFrequency.name : '',
      category: this.selectedCategory ? this.selectedCategory.name : '',
      parameter: this.selectedParameter ? this.selectedParameter.name : '',
      document: this.selectedDocument ? this.selectedDocument.name : '',
      idAmbito: this.selectedScopeId,
      idFrequency: this.selectedFrequency ? this.selectedFrequency.id : '',
      idCategory: this.selectedCategory ? this.selectedCategory.id : '',
      idParameter: this.selectedParameter ? this.selectedParameter.id : '',
      idDocument: this.selectedDocument ? this.selectedDocument.id : ''
    };
  
    if (this.activityBeingEdited && this.currentEditingIndex !== null) {
      // Actualizar actividad existente (no implementado aún en la API)
      this.activities[this.currentEditingIndex] = { ...newActivity };
      if (this.selectedScopeId) {
        this.activitiesByScope[this.selectedScopeId] = [...this.activities];
      }
      this.resetActivityForm();
    } else {
      // Agregar nueva actividad con llamada a API
      // Preparar el payload para la API
      const apiPayload = {
        caso: 'CreaActividad',
        idActividades: 0,
        idAmbito: parseInt(this.selectedScopeId, 10),
        codigo: parseInt(this.activityCode, 10),
        nombre: this.activityName,
        idPeriocidad: parseInt(this.selectedFrequency.id, 10) || 0,
        idCategoriaActividad: parseInt(this.selectedCategory.id, 10) || 0,
        idParametroAsociado: parseInt(this.selectedParameter.id, 10) || 0,
        idBiblioteca: parseInt(this.selectedDocument.id, 10) || 0
      };
      
      console.log('🚀 ENVIANDO SOLICITUD PARA CREAR ACTIVIDAD:', apiPayload);
      this.isLoadingActivities = true;
      
      this.proxyService.post<ApiActivityResponse>('/ws/AmbitosSvcImpl.php', apiPayload)
        .pipe(
          map(response => {
            console.log('📥 RESPUESTA DE CREACIÓN DE ACTIVIDAD:', response);
            if (response && response.success) {
              // Agregar la nueva actividad a la lista local solo si la API responde con éxito
              this.activities.push({ ...newActivity });
              if (this.selectedScopeId) {
                this.activitiesByScope[this.selectedScopeId] = [...this.activities];
              }
              
              this.snackBar.open('Actividad creada con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              
              // Refrescar la lista de actividades para obtener la versión actualizada desde el servidor
              if (this.selectedScopeId) {
                this.loadActivitiesByScope(this.selectedScopeId);
              }
            } else {
              this.snackBar.open(`Error al crear actividad: ${response?.message || 'Error desconocido'}`, 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
            return response;
          }),
          catchError(error => {
            console.error('❌ Error al crear actividad:', error);
            this.snackBar.open(
              `Error al crear actividad: ${error.message || 'Error de conexión'}`,
              'Cerrar',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            return of(null);
          }),
          finalize(() => {
            this.isLoadingActivities = false;
            this.resetActivityForm();
          })
        )
        .subscribe();
    }
  }
  
  /**
   * Edit an existing activity
   */
  editActivity(index: number): void {
    if (index < 0 || index >= this.activities.length) return;
    
    const activity = this.activities[index];
    this.activityCode = activity.code;
    this.activityName = activity.name;
    
    // Reset and set controls with current values
    this.frequencyControl.reset();
    this.categoryControl.reset();
    this.parameterControl.reset();
    this.documentControl.reset();
    
    if (activity.idFrequency) {
      this.selectedFrequency = { id: activity.idFrequency, name: activity.frequency };
      // In a real app, you might need to select the option in the dropdown
    }
    
    if (activity.idCategory) {
      this.selectedCategory = { id: activity.idCategory, name: activity.category };
    }
    
    if (activity.idParameter) {
      this.selectedParameter = { id: activity.idParameter, name: activity.parameter };
    }
    
    if (activity.idDocument) {
      this.selectedDocument = { id: activity.idDocument, name: activity.document };
    }
    
    this.activityBeingEdited = true;
    this.currentEditingIndex = index;
  }
  
  /**
   * Delete an activity
   */
  deleteActivity(index: number): void {
    if (index < 0 || index >= this.activities.length) return;
    
    this.activities.splice(index, 1);
    
    if (this.selectedScopeId) {
      this.activitiesByScope[this.selectedScopeId] = [...this.activities];
    }
    
    // Reset the form if we were editing the item that was deleted
    if (this.activityBeingEdited && this.currentEditingIndex === index) {
      this.resetActivityForm();
    } else if (this.currentEditingIndex !== null && this.currentEditingIndex > index) {
      // Adjust index if we're editing an item that comes after the deleted one
      this.currentEditingIndex--;
    }
  }
  
  /**
   * Filter activities by search value
   */
  applyActivitySearchFilter(): void {
    if (!this.selectedScopeId) return;
    
    const searchTerm = this.searchActivityValue.toLowerCase().trim();
    
    if (!searchTerm) {
      // If no search term, show all activities for the current scope
      this.activities = [...(this.activitiesByScope[this.selectedScopeId] || [])];
      return;
    }
    
    // Filter activities based on search term
    this.activities = (this.activitiesByScope[this.selectedScopeId] || []).filter(activity => {
      return (
        activity.code.toLowerCase().includes(searchTerm) ||
        activity.name.toLowerCase().includes(searchTerm) ||
        activity.frequency.toLowerCase().includes(searchTerm) ||
        activity.category.toLowerCase().includes(searchTerm) ||
        activity.parameter.toLowerCase().includes(searchTerm) ||
        activity.document.toLowerCase().includes(searchTerm)
      );
    });
  }
  
  /**
   * Reset the activity form
   */
  resetActivityForm(): void {
    this.activityCode = '';
    this.activityName = '';
    this.frequencyControl.reset();
    this.categoryControl.reset();
    this.parameterControl.reset();
    this.documentControl.reset();
    this.selectedFrequency = null;
    this.selectedCategory = null;
    this.selectedParameter = null;
    this.selectedDocument = null;
    this.activityBeingEdited = false;
    this.currentEditingIndex = null;
  }
  
  /**
   * Cancel editing an activity
   */
  cancelEditActivity(): void {
    this.resetActivityForm();
  }
}
