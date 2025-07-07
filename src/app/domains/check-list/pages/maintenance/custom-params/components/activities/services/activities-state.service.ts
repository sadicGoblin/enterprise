import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, finalize, forkJoin, map, of, tap } from 'rxjs';
import { ActivitiesService } from './activities.service';
import { ActivityItem, ApiActivityResponse } from '../models/activity.model';
import { CategoryOption, DocumentOption, FrequencyOption, ParameterOption, ReferenceData } from '../models/reference-data.model';
import { ActivitiesMapper } from '../utils/activities-mapper.utils';

@Injectable({
  providedIn: 'root'
})
export class ActivitiesStateService {
  // BehaviorSubjects para estado
  private _loading = new BehaviorSubject<boolean>(false);
  private _activities = new BehaviorSubject<ActivityItem[]>([]);
  private _referenceData = new BehaviorSubject<ReferenceData>({
    frequencyOptions: [],
    categoryOptions: [],
    parameterOptions: [],
    documentOptions: []
  });
  private _selectedScopeId = new BehaviorSubject<number | null>(null);
  private _error = new BehaviorSubject<string | null>(null);

  // Observables públicos
  loading$ = this._loading.asObservable();
  activities$ = this._activities.asObservable();
  referenceData$ = this._referenceData.asObservable();
  selectedScopeId$ = this._selectedScopeId.asObservable();
  error$ = this._error.asObservable();

  constructor(private activitiesService: ActivitiesService) {}

  /**
   * Carga los datos de referencia iniciales (frecuencia, categoría, parámetro, documento)
   */
  loadReferenceData(): void {
    this._loading.next(true);
    this._error.next(null);

    console.log('Iniciando carga de datos de referencia...');
    
    // Ejecutar todas las llamadas API en paralelo
    forkJoin([
      this.activitiesService.getFrequencyOptions(),
      this.activitiesService.getCategoryOptions(),
      this.activitiesService.getParameterOptions(),
      this.activitiesService.getDocumentOptions()
    ]).pipe(
      tap(results => {
        console.log('Datos de referencia recibidos de APIs');
      }),
      map(([freqResponse, catResponse, paramResponse, docResponse]) => {
        // Crear objeto con los datos de todas las API
        const referenceData: ReferenceData = {
          frequencyOptions: freqResponse.success && Array.isArray(freqResponse.data) ? freqResponse.data : [],
          categoryOptions: catResponse.success && Array.isArray(catResponse.data) ? catResponse.data : [],
          parameterOptions: paramResponse.success && Array.isArray(paramResponse.data) ? paramResponse.data : [],
          documentOptions: docResponse.success && Array.isArray(docResponse.data) ? docResponse.data : []
        };
        
        // Log detallado para debugging
        console.log('Opciones de frecuencia cargadas:', referenceData.frequencyOptions.length);
        console.log('Primeras opciones de frecuencia:', referenceData.frequencyOptions.slice(0, 3));
        console.log('Opciones de categoría cargadas:', referenceData.categoryOptions.length);
        console.log('Opciones de parámetro cargadas:', referenceData.parameterOptions.length);
        
        // Debugging extra: verificar que los valores de las opciones sean correctos
        if (referenceData.frequencyOptions.length > 0) {
          const firstOption = referenceData.frequencyOptions[0];
          console.log('Primera opción de frecuencia:', firstOption);
          console.log('Claves disponibles en frecuencia:', Object.keys(firstOption).join(', '));
          console.log('IdSubParam:', firstOption['IdSubParam']);
          console.log('IdDet:', firstOption['IdDet']);
          console.log('Nombre:', firstOption['Nombre']);
        }
        
        return referenceData;
      }),
      catchError(error => {
        console.error('Error al cargar datos de referencia:', error);
        this._error.next('Error al cargar los datos de referencia: ' + (error.message || 'Error desconocido'));
        return of({
          frequencyOptions: [],
          categoryOptions: [],
          parameterOptions: [],
          documentOptions: []
        } as ReferenceData);
      }),
      finalize(() => {
        console.log('Finalizada carga de datos de referencia');
        this._loading.next(false);
      })
    ).subscribe((referenceData: ReferenceData) => {
      console.log('Actualizando estado con datos de referencia');
      this._referenceData.next(referenceData);
    });
  }

  /**
   * Carga actividades por ámbito
   * @param scopeId ID del ámbito
   */
  loadActivitiesByScope(scopeId: number): void {
    if (!scopeId) {
      this._activities.next([]);
      return;
    }
    
    this._loading.next(true);
    this._error.next(null);
    this._selectedScopeId.next(scopeId);

    console.log('ActivitiesStateService: Iniciando llamada API para obtener actividades del ámbito:', scopeId);
    
    this.activitiesService.getActivitiesByScope(scopeId).pipe(
      tap(response => {
        console.log('API response para actividades:', response);
      }),
      map((response: ApiActivityResponse) => {
        console.log('Procesando respuesta API:', response);
        if (response.success && response.data) {
          console.log('Datos recibidos de API:', response.data.length, 'actividades');
          return this.mapActivitiesWithNames(response.data);
        }
        console.log('No se recibieron datos de actividades');
        return [];
      }),
      catchError(error => {
        console.error('Error loading activities:', error);
        this._error.next('Error al cargar las actividades: ' + (error.message || 'Error desconocido'));
        return of([]);
      }),
      finalize(() => {
        console.log('Finalizada carga de actividades');
        this._loading.next(false);
      })
    ).subscribe(activities => {
      console.log('Actualizando estado con actividades:', activities.length);
      this._activities.next(activities);
    });
  }

  /**
   * Crea una nueva actividad
   */
  createActivity(activity: any): Observable<boolean> {
    this._loading.next(true);
    this._error.next(null);

    return this.activitiesService.createActivity(activity).pipe(
      map(response => {
        const success = response.success;
        if (success && this._selectedScopeId.value) {
          // Recargar las actividades si la creación fue exitosa
          this.loadActivitiesByScope(this._selectedScopeId.value);
        } else if (!success) {
          this._error.next('Error al crear la actividad: ' + (response.message || 'Error desconocido'));
        }
        return success;
      }),
      catchError(error => {
        this._error.next('Error al crear la actividad: ' + error.message);
        this._loading.next(false);
        return of(false);
      }),
      finalize(() => this._loading.next(false))
    );
  }

  /**
   * Actualiza una actividad existente
   */
  updateActivity(activity: any): Observable<boolean> {
    this._loading.next(true);
    this._error.next(null);

    return this.activitiesService.updateActivity(activity).pipe(
      map(response => {
        const success = response.success;
        if (success && this._selectedScopeId.value) {
          // Recargar las actividades si la actualización fue exitosa
          this.loadActivitiesByScope(this._selectedScopeId.value);
        } else if (!success) {
          this._error.next('Error al actualizar la actividad: ' + (response.message || 'Error desconocido'));
        }
        return success;
      }),
      catchError(error => {
        this._error.next('Error al actualizar la actividad: ' + error.message);
        this._loading.next(false);
        return of(false);
      }),
      finalize(() => this._loading.next(false))
    );
  }

  /**
   * Elimina una actividad
   */
  deleteActivity(activityId: number): Observable<boolean> {
    this._loading.next(true);
    this._error.next(null);

    return this.activitiesService.deleteActivity(activityId).pipe(
      map(response => {
        const success = response.success;
        if (success && this._selectedScopeId.value) {
          // Recargar las actividades si la eliminación fue exitosa
          this.loadActivitiesByScope(this._selectedScopeId.value);
        } else if (!success) {
          this._error.next('Error al eliminar la actividad: ' + (response.message || 'Error desconocido'));
        }
        return success;
      }),
      catchError(error => {
        this._error.next('Error al eliminar la actividad: ' + error.message);
        this._loading.next(false);
        return of(false);
      }),
      finalize(() => this._loading.next(false))
    );
  }

  /**
   * Método para mapear las actividades con nombres legibles
   * Usa la clase de utilidad ActivitiesMapper
   */
  private mapActivitiesWithNames(activities: any[]): ActivityItem[] {
    if (!activities || !Array.isArray(activities)) {
      return [];
    }

    const referenceData = this._referenceData.getValue();
    return ActivitiesMapper.mapActivitiesWithNames(activities, referenceData);
  }
}