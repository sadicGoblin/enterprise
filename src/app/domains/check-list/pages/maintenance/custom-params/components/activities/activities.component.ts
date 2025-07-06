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
import { ProxyService } from '../../../../../../../core/services/proxy.service';

// Define interfaces
export interface ActivityItem {
  id?: string | number;
  code: string;
  name: string;
  frequency: string;
  category: string;
  parameter: string;
  document: string;
  idAmbito?: string;
  idFrequency?: string;
  idCategory?: string;
  idParameter?: string;
  idDocument?: string;
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
  
  constructor(
    private proxyService: ProxyService,
    private sharedDataService: SharedDataService
  ) {}
  
  ngOnInit(): void {
    // Suscribirse a actualizaciones de ámbitos
    this.ambitosSubscription = this.sharedDataService.ambitosUpdated$.subscribe(() => {
      console.log('🔄 Recibida notificación de actualización de ámbitos en activities.component');
      this.refreshScopeOptions();
    });
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
  
  /**
   * Load activities by scope ID
   */
  loadActivitiesByScope(scopeId: string): void {
    if (!scopeId) {
      this.activities = [];
      return;
    }
    
    // If we already have activities for this scope in cache, use them
    if (this.activitiesByScope[scopeId]) {
      this.activities = [...this.activitiesByScope[scopeId]];
      return;
    }
    
    this.isLoadingActivities = true;
    
    // TODO: Replace with actual API call to load activities by scope
    // For now, just simulate an API call with setTimeout
    setTimeout(() => {
      // Example data - in a real app, this would come from an API
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          code: 'ACT001',
          name: 'Revisión de Estructuras',
          frequency: 'Semanal',
          category: 'Inspección',
          parameter: 'Seguridad',
          document: 'Manual de Inspección',
          idAmbito: scopeId,
          idFrequency: '1',
          idCategory: '1',
          idParameter: '1',
          idDocument: '1'
        },
        {
          id: '2',
          code: 'ACT002',
          name: 'Limpieza de Equipos',
          frequency: 'Diaria',
          category: 'Mantenimiento',
          parameter: 'Operatividad',
          document: 'Procedimiento de Limpieza',
          idAmbito: scopeId,
          idFrequency: '2',
          idCategory: '2',
          idParameter: '2',
          idDocument: '2'
        }
      ];
      
      // Store in cache and update current list
      this.activitiesByScope[scopeId] = mockActivities;
      this.activities = [...mockActivities];
      this.isLoadingActivities = false;
    }, 1000);
    
    // In a real application, replace the above with:
    /*
    this.someService.getActivitiesByScope(scopeId).pipe(
      map(response => {
        this.activitiesByScope[scopeId] = response;
        this.activities = [...response];
      }),
      catchError(error => {
        console.error('Error loading activities:', error);
        this.activitiesByScope[scopeId] = [];
        this.activities = [];
        return of(null);
      }),
      finalize(() => {
        this.isLoadingActivities = false;
      })
    ).subscribe();
    */
  }
  
  /**
   * Add or update an activity
   */
  addActivity(): void {
    if (!this.selectedScopeId || !this.activityCode || !this.activityName) {
      console.error('Missing required fields for activity');
      return;
    }
    
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
      // Update existing activity
      this.activities[this.currentEditingIndex] = { ...newActivity };
      if (this.selectedScopeId) {
        this.activitiesByScope[this.selectedScopeId] = [...this.activities];
      }
      this.resetActivityForm();
    } else {
      // Add new activity
      this.activities.push({ ...newActivity });
      if (this.selectedScopeId) {
        this.activitiesByScope[this.selectedScopeId] = [...this.activities];
      }
      this.resetActivityForm();
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
  
  /**
   * Save all activities to the server
   */
  saveActivity(): void {
    if (!this.selectedScopeId || this.activities.length === 0) {
      console.error('No activities to save or no scope selected');
      return;
    }
    
    // TODO: Implement actual save to server
    console.log('Saving activities:', this.activities);
    
    // In a real app, you would call a service method to save the activities
    /*
    this.isLoadingActivities = true;
    this.someService.saveActivities(this.activities).pipe(
      map(response => {
        console.log('Activities saved successfully:', response);
        // Maybe show a success message
      }),
      catchError(error => {
        console.error('Error saving activities:', error);
        // Show an error message
        return of(null);
      }),
      finalize(() => {
        this.isLoadingActivities = false;
      })
    ).subscribe();
    */
    
    // For demo purposes, just show a success message after a delay
    this.isLoadingActivities = true;
    setTimeout(() => {
      this.isLoadingActivities = false;
      alert('Actividades guardadas exitosamente!');
    }, 1000);
  }
}
