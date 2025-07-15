import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../../../../../../core/services/proxy.service';
import { ApiActivityResponse, NewActivityRequest, UpdateActivityRequest } from '../models/activity.model';
import { CategoryOption, DocumentOption, FrequencyOption, ParameterOption } from '../models/reference-data.model';
import { environment } from '../../../../../../../../../environments/environment';

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
      "caso": "ConsultaActividadesParams",
      "idAmbito": scopeId,
    };
    
    console.log('Enviando payload a API:', payload);
    return this.proxyService.post<ApiActivityResponse>(environment.apiBaseUrl + this.activitiesEndpoint, payload);
  }

  /**
   * Crea una nueva actividad
   */
  createActivity(activity: NewActivityRequest): Observable<ApiActivityResponse> {
    const payload = {
      method: 'crearActividad',
      data: activity
    };
    return this.proxyService.post<ApiActivityResponse>(environment.apiBaseUrl + this.activitiesEndpoint, payload);
  }

  /**
   * Actualiza una actividad existente
   */
  updateActivity(activity: UpdateActivityRequest): Observable<ApiActivityResponse> {
    const payload = {
      method: 'actualizarActividad',
      data: activity
    };
    return this.proxyService.post<ApiActivityResponse>(environment.apiBaseUrl + this.activitiesEndpoint, payload);
  }

  /**
   * Elimina una actividad por su ID
   */
  deleteActivity(activityId: number): Observable<ApiActivityResponse> {
    const payload = {
      method: 'eliminarActividad',
      data: { idActividad: activityId }
    };
    return this.proxyService.post<ApiActivityResponse>(environment.apiBaseUrl + this.activitiesEndpoint, payload);
  }

  /**
   * Obtiene las opciones de frecuencia
   */
  getFrequencyOptions(): Observable<{ success: boolean, data: FrequencyOption[] }> {
    const payload = {
      method: 'obtenerSubParametros',
      data: { idParametro: 1 }
    };
    return this.proxyService.post<{ success: boolean, data: FrequencyOption[] }>(environment.apiBaseUrl + this.frequencyEndpoint, payload);
  }

  /**
   * Obtiene las opciones de categoría
   */
  getCategoryOptions(): Observable<{ success: boolean, data: CategoryOption[] }> {
    const payload = {
      method: 'obtenerSubParametros',
      data: { idParametro: 2 }
    };
    return this.proxyService.post<{ success: boolean, data: CategoryOption[] }>(environment.apiBaseUrl + this.categoryEndpoint, payload);
  }

  /**
   * Obtiene las opciones de parámetros
   */
  getParameterOptions(): Observable<{ success: boolean, data: ParameterOption[] }> {
    const payload = {
      method: 'obtenerParametros'
    };
    return this.proxyService.post<{ success: boolean, data: ParameterOption[] }>(environment.apiBaseUrl + this.parameterEndpoint, payload);
  }

  /**
   * Obtiene las opciones de documentos
   */
  getDocumentOptions(): Observable<{ success: boolean, data: DocumentOption[] }> {
    const payload = {
      method: 'obtenerDocumentos'
    };
    return this.proxyService.post<{ success: boolean, data: DocumentOption[] }>(environment.apiBaseUrl + this.documentEndpoint, payload);
  }

  /**
   * Obtiene los ámbitos disponibles
   */
  getScopeOptions(): Observable<{ success: boolean, data: any[] }> {
    const payload = {
      method: 'obtenerAmbitos'
    };
    return this.proxyService.post<{ success: boolean, data: any[] }>(environment.apiBaseUrl + this.scopeEndpoint, payload);
  }
}