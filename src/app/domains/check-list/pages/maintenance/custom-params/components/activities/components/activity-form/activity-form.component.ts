import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { ReferenceData } from '../../models/reference-data.model';
import { ActivityItem, ApiActivityResponse } from '../../models/activity.model';

// Importar el custom-select component con la ruta correcta
import {
  CustomSelectComponent,
  SelectOption,
  ParameterType,
} from '../../../../../../../../../shared/controls/custom-select/custom-select.component';
import { MatIconModule } from '@angular/material/icon';
import { ProxyService } from '../../../../../../../../../core/services/proxy.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    CustomSelectComponent,
  ],
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.scss'],
})
export class ActivityFormComponent implements OnInit, OnChanges {
  @Input() isEditing = false;
  @Input() activityToEdit?: ActivityItem;
  @Input() scopeOptions: any[] = [];
  @Input() referenceData!: ReferenceData;
  @ViewChild('scopeSelect') scopeSelect!: CustomSelectComponent;

  @Output() saveActivity = new EventEmitter<any>();
  @Output() cancelEdit = new EventEmitter<void>();
  @Output() scopeChange = new EventEmitter<string>();

  activityForm!: FormGroup;

  // Enumeraciones para los tipos de parámetros (para el custom-select)
  parameterTypes = ParameterType;

  // Activities data
  activities: ActivityItem[] = [];
  isLoadingActivities = false;
  searchActivityValue = '';
  currentEditingIndex: number | null = null;
  activityBeingEdited: boolean = false;
  activitiesByScope: Record<string, ActivityItem[]> = {};
  selectedScopeId: string | null = null;
  
  // Selected values
  selectedFrequency: any = null;
  selectedCategory: any = null;
  selectedParameter: any = null;
  selectedDocument: any = null;
  selectedScopeOption: any = null;

  // Endpoints y request bodies para APIs
  documentApiEndpoint = '/ws/BibliotecaSvcImpl.php';
  documentApiRequestBody = {
    caso: 'ConsultaSinDocumento',
    idBiblioteca: '0',
  };

  // Parameter API configuration - using custom API
  parameterApiEndpoint = '/ws/ParametrosSvcImpl.php';
  parameterApiRequestBody = {
    caso: 'DetalleConsulta',
    idCab: 5,
  };

  // Category API configuration - using custom API
  categoryApiEndpoint = '/ws/SubParametrosSvcImpl.php';
  categoryApiRequestBody = {
    caso: 'SubParametroConsulta',
    idEnt: 141,
  };

  // Frequency API configuration - using custom API
  frequencyApiEndpoint = '/ws/SubParametrosSvcImpl.php';
  frequencyApiRequestBody = {
    caso: 'SubParametroConsulta',
    idEnt: 4,
  };

  // Scope API configuration - using custom API
  scopeApiEndpoint = '/ws/AmbitosSvcImpl.php';
  scopeApiRequestBody = {
    caso: 'ConsultaAmbitos',
    idAmbito: 0,
    nombre: null,
    codigo: 0,
  };
  
  // Form controls
  scopeControl = new FormControl(null, Validators.required);
  frequencyControl = new FormControl(null, Validators.required);
  categoryControl = new FormControl(null, Validators.required);
  parameterControl = new FormControl(null);
  documentControl = new FormControl(null);

  constructor(
    private fb: FormBuilder,
    private proxyService: ProxyService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    console.log('📝 ngOnChanges - isEditing:', this.isEditing, 'activityToEdit:', this.activityToEdit);
    // React to changes in activityToEdit input
    if (this.isEditing && this.activityToEdit && this.activityForm) {
      this.activityBeingEdited = true;
      this.populateFormWithActivity(this.activityToEdit);
    } else if (!this.isEditing) {
      // Reset to add mode
      this.activityBeingEdited = false;
      this.resetActivityForm();
    }
  }

  initForm(): void {
    this.activityForm = this.fb.group({
      scopeId: this.scopeControl,
      code: ['', Validators.required],
      name: ['', Validators.required],
      frequencyId: this.frequencyControl,
      categoryId: this.categoryControl,
      parameterId: this.parameterControl,
      documentId: this.documentControl,
    });
    
    // If we're editing an activity, populate the form
    if (this.isEditing && this.activityToEdit) {
      this.activityBeingEdited = true;
      this.populateFormWithActivity(this.activityToEdit);
    }
  }
  
  private populateFormWithActivity(activity: ActivityItem): void {
    console.log('🔄 Poblando formulario con actividad:', activity);
    
    // Set form control values
    this.activityForm.patchValue({
      code: activity.code,
      name: activity.name,
    });
    
    // Set scope selection if available
    if (activity.idAmbito) {
      this.scopeControl.setValue(activity.idAmbito as any);
      this.selectedScopeOption = {
        value: activity.idAmbito,
        label: activity.scopeName || 'Ámbito'
      };
    }
    
    // Set frequency selection if available and reference data exists
    if (activity.idFrequency && this.referenceData?.frequencyOptions) {
      this.frequencyControl.setValue(activity.idFrequency as any);
      const frequencyOption = this.referenceData.frequencyOptions.find(f => f['value'] === activity.idFrequency);
      if (frequencyOption) {
        this.selectedFrequency = {
          id: activity.idFrequency,
          name: frequencyOption['label'],
          label: frequencyOption['label']
        };
      }
    }
    
    // Set category selection if available and reference data exists  
    if (activity.idCategory && this.referenceData?.categoryOptions) {
      this.categoryControl.setValue(activity.idCategory as any);
      const categoryOption = this.referenceData.categoryOptions.find(c => c['value'] === activity.idCategory);
      if (categoryOption) {
        this.selectedCategory = {
          id: activity.idCategory,
          name: categoryOption['label'],
          label: categoryOption['label']
        };
      }
    }
    
    // Set parameter selection if available and reference data exists
    if (activity.idParameter && this.referenceData?.parameterOptions) {
      this.parameterControl.setValue(activity.idParameter as any);
      const parameterOption = this.referenceData.parameterOptions.find(p => p['value'] === activity.idParameter);
      if (parameterOption) {
        this.selectedParameter = {
          id: activity.idParameter,
          name: parameterOption['label'],
          label: parameterOption['label']
        };
      }
    }
    
    // Set document selection if available
    // Use idBiblioteca since that's the actual field name in the activity data
    const documentId = activity.idDocument || (activity as any).idBiblioteca;
    if (documentId) {
      console.log('🗂️ Setting document ID:', documentId);
      this.documentControl.setValue(documentId as any);
      // Set the selected document info for internal tracking
      this.selectedDocument = {
        id: documentId,
        name: activity.document || 'Documento',
        label: activity.document || 'Documento'
      };
    }
    
    console.log('✅ Formulario poblado con:', {
      scope: this.selectedScopeOption,
      frequency: this.selectedFrequency,
      category: this.selectedCategory,
      parameter: this.selectedParameter,
      document: this.selectedDocument
    });
  }

  onSubmit(): void {
    if (this.activityForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    const formValues = this.activityForm.value;
    
    const activityData = {
      id: this.isEditing && this.activityToEdit ? this.activityToEdit.id : 0,
      code: formValues.code,
      name: formValues.name,
      idAmbito: formValues.scopeId,
      idFrequency: formValues.frequencyId,
      idCategory: formValues.categoryId,
      idParameter: formValues.parameterId || 0,
      idDocument: formValues.documentId || 0,
      // Include the selected names for display purposes
      scopeName: this.selectedScopeOption?.label || '',
      frequency: this.selectedFrequency?.label || '',
      category: this.selectedCategory?.label || '',
      parameter: this.selectedParameter?.label || '',
      document: this.selectedDocument?.label || ''
    };
    
    this.saveActivity.emit(activityData);
    this.resetActivityForm();
  }

  onScopeSelectionChange(selectedOption: SelectOption): void {
    if (!selectedOption) {
      console.log('✅ No se seleccionó ningún ámbito');
      this.selectedScopeId = null;
      this.activities = [];
      return;
    }

    const scopeId = selectedOption.value as string;
    console.log('✅ Ámbito seleccionado:', selectedOption.label, '| ID:', scopeId);
    this.selectedScopeId = scopeId;
    this.selectedScopeOption = {
      id: scopeId,
      name: selectedOption.label,
    };
    
    // Emitimos un evento al componente principal para que cargue las actividades
    console.log('✅ Emitiendo evento al componente principal para cargar actividades del ámbito:', scopeId);
    // Emitir scope change al componente padre
    this.scopeChange.emit(scopeId);
  }

  onFrequencySelectionChange(selectedOption: SelectOption): void {
    if (selectedOption) {
      console.log('✅ Frecuencia seleccionada:', selectedOption);
      console.log('  ID:', selectedOption.value, '| Tipo:', typeof selectedOption.value);
      console.log('  Nombre:', selectedOption.label);
      console.log('  Objeto completo:', selectedOption);
      
      // Guardar la selección
      this.selectedFrequency = {
        id: selectedOption.value,
        name: selectedOption.label,
      };
      
      // Mostrar información para debugging
      console.log('💡 Esta frecuencia debe coincidir con idPeriocidad en las actividades');
    } else {
      console.log('❌ No se seleccionó ninguna frecuencia');
      this.selectedFrequency = null;
    }
  }

  onCategorySelectionChange(selectedOption: SelectOption): void {
    if (selectedOption) {
      console.log('✅ Categoría seleccionada:', selectedOption);
      console.log('  ID:', selectedOption.value, '| Tipo:', typeof selectedOption.value);
      console.log('  Nombre:', selectedOption.label);
      console.log('  Objeto completo:', selectedOption);
      
      // Guardar la selección
      this.selectedCategory = {
        id: selectedOption.value,
        name: selectedOption.label,
      };
      
      // Mostrar información para debugging
      console.log('💡 Esta categoría debe coincidir con idCategoriaActividad en las actividades');
    } else {
      console.log('❌ No se seleccionó ninguna categoría');
      this.selectedCategory = null;
    }
  }

  onParameterSelectionChange(selectedOption: SelectOption): void {
    if (selectedOption) {
      console.log('✅ Parámetro seleccionado:', selectedOption);
      console.log('  ID:', selectedOption.value, '| Tipo:', typeof selectedOption.value);
      console.log('  Nombre:', selectedOption.label);
      console.log('  Objeto completo:', selectedOption);
      
      // Guardar la selección
      this.selectedParameter = {
        id: selectedOption.value,
        name: selectedOption.label,
      };
      
      // Mostrar información para debugging
      console.log('💡 Este parámetro debe coincidir con idParametroAsociado en las actividades');
    } else {
      console.log('❌ No se seleccionó ningún parámetro');
      this.selectedParameter = null;
    }
  }

  onDocumentSelectionChange(selectedOption: SelectOption): void {
    if (selectedOption) {
      this.selectedDocument = {
        id: selectedOption.value,
        name: selectedOption.label,
      };
    } else {
      this.selectedDocument = null;
    }
  }

  cancelEditActivity(): void {
    this.resetActivityForm();
    this.cancelEdit.emit();
  }

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
      caso: 'ConsultaActividades',
      idActividades: 0,
      idAmbito: parseInt(scopeId, 10),
      codigo: 0,
      nombre: null,
      idPeriocidad: 0,
      idCategoriaActividad: 0,
      idParametroAsociado: 0,
      idBiblioteca: 0,
    };

    console.log(
      '🔍 Consultando actividades para el ámbito:',
      scopeId,
      'con payload:',
      payload
    );

    // this.proxyService
    //   .post<ApiActivityResponse>('/ws/AmbitosSvcImpl.php', payload)
    //   .pipe(
    //     map((response) => {
    //       console.log('📥 Respuesta de consulta de actividades:', response);
    //       if (response && response.success && Array.isArray(response.data)) {
    //         const activities = response.data.map((item) => {
    //           // Mapear los IDs a sus nombres usando los métodos auxiliares
    //           // const frequencyName = this.getFrequencyNameById(item.idPeriocidad);
    //           // const categoryName = this.getCategoryNameById(item.idCategoriaActividad);
    //           // const parameterName = this.getParameterNameById(item.idParametroAsociado);
    //           // const documentName = this.getDocumentNameById(item.idBiblioteca);

    //           return {
    //             id: item.idActividades,
    //             code: item.codigo,
    //             name: item.nombre,
    //             // frequency: frequencyName,  // Nombre en lugar de ID
    //             // category: categoryName,    // Nombre en lugar de ID
    //             // parameter: parameterName,  // Nombre en lugar de ID
    //             // document: documentName,    // Nombre en lugar de ID
    //             idAmbito: item.idAmbito,
    //             idFrequency: item.idPeriocidad,
    //             idCategory: item.idCategoriaActividad,
    //             idParameter: item.idParametroAsociado,
    //             idDocument: item.idBiblioteca,
    //           };
    //         });

    //         console.log(
    //           `✅ ${activities.length} actividades procesadas para el ámbito ${scopeId}:`,
    //           activities
    //         );
    //         return activities;
    //       } else {
    //         console.warn(
    //           '⚠️ No se encontraron actividades para este ámbito o hay un error en la respuesta'
    //         );
    //         return [];
    //       }
    //     }),
    //     catchError((error) => {
    //       console.error('❌ Error al cargar actividades:', error);
    //       this.snackBar.open(
    //         `Error al cargar actividades: ${
    //           error.message || 'Error de conexión'
    //         }`,
    //         'Cerrar',
    //         { duration: 5000, panelClass: ['error-snackbar'] }
    //       );
    //       return of([]);
    //     }),
    //     finalize(() => {
    //       this.isLoadingActivities = false;
    //     })
    //   )
    //   .subscribe((activities) => {
    //     // Guardar en caché y actualizar la lista actual
    //     this.activitiesByScope[scopeId] = activities;
    //     this.activities = [...activities];
    //   });
  }

  resetActivityForm(): void {
    this.activityForm.reset();
    this.frequencyControl.reset();
    this.categoryControl.reset();
    this.parameterControl.reset();
    this.documentControl.reset();
    this.scopeControl.reset();
    this.selectedFrequency = null;
    this.selectedCategory = null;
    this.selectedParameter = null;
    this.selectedDocument = null;
    this.selectedScopeOption = null;
    this.activityBeingEdited = false;
    this.currentEditingIndex = null;
  }

}
