import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../../../../../../core/services/proxy.service';
import { ApiActivityResponse, NewActivityRequest, UpdateActivityRequest } from '../models/activity.model';
import { CategoryOption, DocumentOption, FrequencyOption, ParameterOption } from '../models/reference-data.model';

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  // Endpoints
  private readonly activitiesEndpoint = '/ws/AmbitosSvcImpl.php';
  private readonly frequencyEndpoint = '/ws/ParametrosSvcImpl.php';
  private readonly categoryEndpoint = '/ws/ParametrosSvcImpl.php';
  private readonly parameterEndpoint = '/ws/ParametrosSvcImpl.php';
  private readonly documentEndpoint = '/ws/ParametrosSvcImpl.php';
  private readonly scopeEndpoint = '/ws/ParametrosSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Obtiene las actividades por ámbito
   */
  getActivitiesByScope(scopeId: number): Observable<ApiActivityResponse> {
    const payload = {
      "caso": "ConsultaActividades",
      "idActividades": 0,
      "idAmbito": scopeId,
      "codigo": 0,
      "nombre": null,
      "idPeriocidad": 0,
      "idCategoriaActividad": 0,
      "idParametroAsociado": 0,
      "idBiblioteca": 0
    };
    
    console.log('Enviando payload a API:', payload);
    return this.proxyService.post<ApiActivityResponse>(this.activitiesEndpoint, payload);
  }

  /**
   * Crea una nueva actividad
   */
  createActivity(activity: NewActivityRequest): Observable<ApiActivityResponse> {
    const payload = {
      method: 'crearActividad',
      data: activity
    };
    return this.proxyService.post<ApiActivityResponse>(this.activitiesEndpoint, payload);
  }

  /**
   * Actualiza una actividad existente
   */
  updateActivity(activity: UpdateActivityRequest): Observable<ApiActivityResponse> {
    const payload = {
      method: 'actualizarActividad',
      data: activity
    };
    return this.proxyService.post<ApiActivityResponse>(this.activitiesEndpoint, payload);
  }

  /**
   * Elimina una actividad por su ID
   */
  deleteActivity(activityId: number): Observable<ApiActivityResponse> {
    const payload = {
      method: 'eliminarActividad',
      data: { idActividad: activityId }
    };
    return this.proxyService.post<ApiActivityResponse>(this.activitiesEndpoint, payload);
  }

  /**
   * Obtiene las opciones de frecuencia
   */
  getFrequencyOptions(): Observable<{ success: boolean, data: FrequencyOption[] }> {
    const payload = {
      method: 'obtenerSubParametros',
      data: { idParametro: 1 }
    };
    return this.proxyService.post<{ success: boolean, data: FrequencyOption[] }>(this.frequencyEndpoint, payload);
  }

  /**
   * Obtiene las opciones de categoría
   */
  getCategoryOptions(): Observable<{ success: boolean, data: CategoryOption[] }> {
    const payload = {
      method: 'obtenerSubParametros',
      data: { idParametro: 2 }
    };
    return this.proxyService.post<{ success: boolean, data: CategoryOption[] }>(this.categoryEndpoint, payload);
  }

  /**
   * Obtiene las opciones de parámetros
   */
  getParameterOptions(): Observable<{ success: boolean, data: ParameterOption[] }> {
    const payload = {
      method: 'obtenerParametros'
    };
    return this.proxyService.post<{ success: boolean, data: ParameterOption[] }>(this.parameterEndpoint, payload);
  }

  /**
   * Obtiene las opciones de documentos
   */
  getDocumentOptions(): Observable<{ success: boolean, data: DocumentOption[] }> {
    const payload = {
      method: 'obtenerDocumentos'
    };
    return this.proxyService.post<{ success: boolean, data: DocumentOption[] }>(this.documentEndpoint, payload);
  }

  /**
   * Obtiene los ámbitos disponibles
   */
  getScopeOptions(): Observable<{ success: boolean, data: any[] }> {
    const payload = {
      method: 'obtenerAmbitos'
    };
    return this.proxyService.post<{ success: boolean, data: any[] }>(this.scopeEndpoint, payload);
  }
}