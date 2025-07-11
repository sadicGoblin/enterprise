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
    
    // Obtener los datos de referencia actuales
    const referenceData = this._referenceData.getValue();
    
    // Mostrar datos de referencia disponibles
    console.log('📊 DATOS DE REFERENCIA DISPONIBLES:');
    console.log('Frecuencias:', referenceData.frequencyOptions.length, 'opciones');
    if (referenceData.frequencyOptions.length > 0) {
      console.log('Muestra de frecuencias:', referenceData.frequencyOptions.slice(0, 5).map(opt => ({
        IdSubParam: opt['IdSubParam'],
        IdDet: opt['IdDet'],
        Nombre: opt['Nombre'],
        nombre: opt['nombre']
      })));
    }
    
    console.log('Categorías:', referenceData.categoryOptions.length, 'opciones');
    if (referenceData.categoryOptions.length > 0) {
      console.log('Muestra de categorías:', referenceData.categoryOptions.slice(0, 5).map(opt => ({
        IdSubParam: opt['IdSubParam'],
        IdDet: opt['IdDet'],
        Nombre: opt['Nombre'],
        nombre: opt['nombre']
      })));
    }
    
    console.log('Parámetros:', referenceData.parameterOptions.length, 'opciones');
    if (referenceData.parameterOptions.length > 0) {
      console.log('Muestra de parámetros:', referenceData.parameterOptions.slice(0, 5).map(opt => ({
        IdSubParam: opt['IdSubParam'],
        IdDet: opt['IdDet'],
        Nombre: opt['Nombre'],
        nombre: opt['nombre']
      })));
    }
    
    this.activitiesService.getActivitiesByScope(scopeId).pipe(
      tap(response => {
        console.log('API response para actividades:', response);
      }),
      map((response: ApiActivityResponse) => {
        console.log('Procesando respuesta API:', response);
        if (response.success && response.data) {
          console.log('Datos recibidos de API:', response.data.length, 'actividades');
          
          // Convertir directamente los datos sin mapeo de nombres
          const mappedActivities = response.data.map((activity: any) => {
            // Crear un objeto ActivityItem con los datos originales
            return {
              id: activity.idActividades?.toString() || activity.idactividad?.toString() || '',
              code: activity.codigo || '',
              name: activity.nombre || '',
              // Mantener las propiedades originales para la tabla
              codigo: activity.codigo || '',
              nombre: activity.nombre || '',
              frequency: activity.idPeriocidad?.toString() || '',
              category: activity.idCategoriaActividad?.toString() || '',
              parameter: activity.idParametroAsociado?.toString() || '',
              document: activity.idBiblioteca?.toString() || '',
              idAmbito: activity.idAmbito?.toString() || '',
              idFrequency: activity.idPeriocidad?.toString() || '',
              idCategory: activity.idCategoriaActividad?.toString() || '',
              idParameter: activity.idParametroAsociado?.toString() || '',
              idDocument: activity.idBiblioteca?.toString() || '',
              // Usar los nombres que vienen directamente del backend si están disponibles
              periocidad: activity.periocidad || null,
              CategoriaActividad: activity.CategoriaActividad || null,
              parametroAsociado: activity.parametroAsociado || null,
              documentoAsociado: activity.documentoAsociado || null,
              // Mantener los campos anteriores para compatibilidad
              frequencyName: activity.periocidad || activity.idPeriocidad?.toString() || 'No disponible',
              categoryName: activity.CategoriaActividad || activity.idCategoriaActividad?.toString() || 'No disponible',
              parameterName: activity.parametroAsociado || activity.idParametroAsociado?.toString() || 'No disponible',
              documentName: activity.documentoAsociado || activity.idBiblioteca?.toString() || 'No disponible'
            };
          });
          
          // Mostrar un ejemplo de los datos mapeados
          if (mappedActivities.length > 0) {
            console.log('Ejemplo de actividad mapeada:', mappedActivities[0]);
          }
          
          // Mostrar información detallada de cada actividad y sus posibles coincidencias
          console.log('🔍 ANÁLISIS DE ACTIVIDADES Y REFERENCIAS:');
          mappedActivities.slice(0, 3).forEach((activity: any, index: number) => {
            console.log(`Actividad ${index + 1}: ${activity.nombre} (ID: ${activity.id})`);
            
            // Buscar coincidencias de frecuencia
            console.log(`  Frecuencia ID: ${activity.idFrequency}`);
            const matchingFreq = referenceData.frequencyOptions.find(opt => 
              opt['IdSubParam']?.toString() === activity.idFrequency ||
              opt['IdDet']?.toString() === activity.idFrequency ||
              opt['id']?.toString() === activity.idFrequency
            );
            console.log(`  Frecuencia encontrada: ${matchingFreq ? 'SÍ' : 'NO'}`);
            if (matchingFreq) {
              console.log(`  Nombre de frecuencia: ${matchingFreq['Nombre'] || matchingFreq['nombre'] || 'No disponible'}`);
            }
            
            // Buscar coincidencias de categoría
            console.log(`  Categoría ID: ${activity.idCategory}`);
            const matchingCat = referenceData.categoryOptions.find(opt => 
              opt['IdSubParam']?.toString() === activity.idCategory ||
              opt['IdDet']?.toString() === activity.idCategory ||
              opt['id']?.toString() === activity.idCategory
            );
            console.log(`  Categoría encontrada: ${matchingCat ? 'SÍ' : 'NO'}`);
            if (matchingCat) {
              console.log(`  Nombre de categoría: ${matchingCat['Nombre'] || matchingCat['nombre'] || 'No disponible'}`);
            }
            
            // Buscar coincidencias de parámetro
            console.log(`  Parámetro ID: ${activity.idParameter}`);
            const matchingParam = referenceData.parameterOptions.find(opt => 
              opt['IdSubParam']?.toString() === activity.idParameter ||
              opt['IdDet']?.toString() === activity.idParameter ||
              opt['id']?.toString() === activity.idParameter
            );
            console.log(`  Parámetro encontrado: ${matchingParam ? 'SÍ' : 'NO'}`);
            if (matchingParam) {
              console.log(`  Nombre de parámetro: ${matchingParam['Nombre'] || matchingParam['nombre'] || 'No disponible'}`);
            }
          });
          
          return mappedActivities;
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