import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import {
  map,
  filter,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  startWith,
} from 'rxjs/operators';
import { ActivityFormComponent } from './components/activity-form/activity-form.component';
import { ActivitiesTableComponent } from './components/activities-table/activities-table.component';
import { ActivitiesStateService } from './services/activities-state.service';
import { ActivityItem } from './models/activity.model';
import { ReferenceData } from './models/reference-data.model';

// Definición del tipo para el parámetro CUSTOM_API
export enum ParameterType {
  CUSTOM_API = 'CUSTOM_API',
}

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    MatDividerModule,
    MatTooltipModule,
    ActivityFormComponent,
    ActivitiesTableComponent,
  ],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  // Variables de UI
  isLoading = false;
  isFormVisible = true; // El formulario siempre es visible
  isAddMode = true;
  selectedActivityId: number | null = null;
  selectedActivity: ActivityItem | undefined = undefined;

  // Endpoint y configuración para API de ámbitos
  scopeApiEndpoint = '/ws/AmbitosSvcImpl.php';
  scopeApiRequestBody = {
    caso: 'ConsultaAmbitos',
    idAmbito: 0,
    nombre: null,
    codigo: 0,
  };

  // Enum para tipos de parámetros en custom-select
  parameterTypes = ParameterType;

  // Controls para filtros
  scopeControl = new FormControl<string | null>(null);
  scopeOptions: any[] = [];

  // Subjects y Observables para gestión de estado
  private destroy$ = new Subject<void>();
  private searchTerm$ = new BehaviorSubject<string>('');
  private selectedScope$ = new BehaviorSubject<string | null>(null);

  // Propiedades de datos y control de interfaz
  activities$!: Observable<ActivityItem[]>;
  filteredActivities$!: Observable<ActivityItem[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  referenceData$!: Observable<ReferenceData>;

  // Objeto vacío para referenciar como fallback
  emptyReferenceData: ReferenceData = {
    frequencyOptions: [],
    categoryOptions: [],
    parameterOptions: [],
    documentOptions: [],
  };

  // Referencia al componente hijo de formulario
  @ViewChild(ActivityFormComponent)
  activityFormComponent!: ActivityFormComponent;
  
  // Referencia al elemento del formulario para scroll automático
  @ViewChild('activityForm', { read: ElementRef })
  activityFormElement!: ElementRef;

  constructor(
    private activitiesStateService: ActivitiesStateService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar observables para evitar errores de tipo
    this.activities$ = of([]);
    this.filteredActivities$ = of([]);
    this.loading$ = of(false);
    this.error$ = of(null);
    this.referenceData$ = of({} as ReferenceData);
  }

  ngOnInit(): void {
    // Cargar datos de referencia usando el servicio de estado
    this.activitiesStateService.loadReferenceData();

    // Inicializar observables desde el servicio de estado
    this.loading$ = this.activitiesStateService.loading$;
    this.error$ = this.activitiesStateService.error$;
    this.referenceData$ = this.activitiesStateService.referenceData$;

    // Suscribirse a los cambios del selector de ámbito
    this.scopeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((scopeId) => {
        this.selectedScope$.next(scopeId);
        if (scopeId) {
          this.loadActivitiesByScope(scopeId);
        }
      });

    // Cargar las actividades cuando cambia el ámbito seleccionado
    this.activities$ = this.activitiesStateService.activities$;

    // Establecer suscripción para cargar actividades cuando cambia el ámbito seleccionado
    this.selectedScope$
      .pipe(
        filter((scopeId) => !!scopeId),
        takeUntil(this.destroy$)
      )
      .subscribe((scopeId) => {
        if (scopeId) {
          this.loadActivitiesByScope(scopeId);
        }
      });

    // Aplicar filtros de búsqueda a las actividades
    this.filteredActivities$ = combineLatest([
      this.activities$ || of([]),
      this.searchTerm$,
    ]).pipe(
      map(([activities, searchTerm]) => {
        if (!searchTerm.trim()) {
          return activities;
        }
        const term = searchTerm.toLowerCase();
        return activities.filter(
          (activity) =>
            activity.name.toLowerCase().includes(term) ||
            activity.code.toLowerCase().includes(term) ||
            activity.frequency.toLowerCase().includes(term) ||
            activity.category.toLowerCase().includes(term) ||
            (activity.parameter &&
              activity.parameter.toLowerCase().includes(term)) ||
            (activity.document &&
              activity.document.toLowerCase().includes(term))
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método para restablecer el formulario a modo agregar
  toggleFormVisibility(): void {
    // El formulario siempre es visible, solo cambiamos a modo agregar
    this.isAddMode = true;
    this.selectedActivityId = null;
    this.selectedActivity = undefined;
  }

  // Método para cargar actividades por ámbito
  loadActivitiesByScope(scopeId: string): void {
    // Convertir string a número o usar 0 como fallback si la conversión falla
    const scopeIdNumber = parseInt(scopeId, 10) || 0;
    console.log('Cargando actividades para ámbito ID:', scopeIdNumber);
    this.activitiesStateService.loadActivitiesByScope(scopeIdNumber);
  }

  // Método para manejar la acción de editar una actividad desde la tabla
  handleEditActivity(activity: ActivityItem): void {
    console.log('🖊️ Editando actividad:', activity);
    // this.selectedActivityId = activity.id;
    this.selectedActivity = activity;
    this.isAddMode = false;
    this.isFormVisible = true;
    
    // Scroll automático hacia el formulario
    setTimeout(() => {
      if (this.activityFormElement) {
        this.activityFormElement.nativeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100); // Pequeño delay para asegurar que el DOM se actualice
  }

  // Método para manejar la acción de eliminar una actividad desde la tabla
  handleDeleteActivity(activityId: number): void {
    this.activitiesStateService
      .deleteActivity(activityId)
      .subscribe((success) => {
        if (success) {
          this.snackBar.open('Actividad eliminada correctamente', 'Cerrar', {
            duration: 3000,
          });
        }
      });
  }

  // Método para manejar la acción de guardar una actividad desde el formulario
  handleSaveActivity(activityData: any): void {
    if (this.isAddMode) {
      this.activitiesStateService
        .createActivity(activityData)
        .subscribe((success) => {
          if (success) {
            this.snackBar.open('Actividad creada correctamente', 'Cerrar', {
              duration: 3000,
            });
            // Resetear el formulario para crear una nueva actividad
            this.isAddMode = true;
            this.selectedActivityId = null;
            this.selectedActivity = undefined;
          }
        });
    } else {
      this.activitiesStateService
        .updateActivity(activityData)
        .subscribe((success) => {
          if (success) {
            this.snackBar.open(
              'Actividad actualizada correctamente',
              'Cerrar',
              {
                duration: 3000,
              }
            );
            // Resetear el formulario para crear una nueva actividad
            this.isAddMode = true;
            this.selectedActivityId = null;
            this.selectedActivity = undefined;
          }
        });
    }
  }

  // Método para manejar la cancelación de la edición
  handleCancelEdit(): void {
    // El formulario siempre es visible
    this.isAddMode = true;
    this.selectedActivityId = null;
    this.selectedActivity = undefined;
  }
  
  // Método para manejar el cambio de ámbito desde el formulario
  handleScopeChange(scopeId: string): void {
    console.log('👉 Componente principal: Ámbito seleccionado:', scopeId);
    if (scopeId) {
      this.loadActivitiesByScope(scopeId);
    }
  }
}
