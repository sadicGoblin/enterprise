import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';
import { ObraRequest, ObrasFullResponse, ObrasSimpleResponse } from '../models/obra.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ObraService {
  // API URL using relative path that will be handled by the proxy
  private readonly apiUrl = '/ws/ObrasSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Get all obras from API
   * @returns Observable with obra data
   */
  getObras(): Observable<ObrasFullResponse> {
    const request: ObraRequest = {
      caso: 'Consultas',
      idObra: 0,
      idUsuario: 0
    };
    
    console.log('[ObraService] Fetching obras with request:', request);
    return this.proxyService.post<ObrasFullResponse>(environment.apiBaseUrl + this.apiUrl, request);
  }

  /**
   * Get obras for a specific user
   * @param userId ID of the user to get obras for
   * @returns Observable with obra data filtered by user
   */
  getObrasByUser(userId: number): Observable<ObrasSimpleResponse> {
    const request: ObraRequest = {
      caso: 'Consulta', // Note: different caso value as specified in the requirements
      idObra: 0,
      idUsuario: userId
    };
    
    console.log(`[ObraService] Fetching obras for user ${userId} with request:`, request);
    return this.proxyService.post<ObrasSimpleResponse>(environment.apiBaseUrl + this.apiUrl, request);
  }

  /**
   * Create a new obra
   * @param obraData Data for the new obra
   * @returns Observable with the creation response
   */
  createObra(obraData: any): Observable<ObrasFullResponse> {
    // Ensure the case parameter is set correctly
    const request = {
      caso: 'Crea',
      obra: obraData.obra,
      codigo: obraData.codigo,
      direccion: obraData.direccion,
      idComuna: obraData.idComuna,
      fechaInicio: obraData.fechaInicio,
      fechaTermino: obraData.fechaTermino,
      observaciones: obraData.observaciones,
      docfile: obraData.docfile
    };
    
    console.log('[ObraService] Creating obra with request:', request);
    return this.proxyService.post<ObrasFullResponse>(environment.apiBaseUrl + this.apiUrl, request);
  }
  
  /**
   * Update an existing obra
   * @param obraData Data for the obra to update
   * @returns Observable with the update response
   */
  updateObra(obraData: any): Observable<ObrasFullResponse> {
    // Ensure the case parameter is set correctly
    const request = {
      caso: 'Actualiza',
      idObra: obraData.idObra,
      obra: obraData.obra,
      codigo: obraData.codigo,
      direccion: obraData.direccion,
      idComuna: obraData.idComuna,
      comuna: obraData.comuna, // Incluir el campo comuna en la solicitud
      fechaInicio: obraData.fechaInicio,
      fechaTermino: obraData.fechaTermino,
      observaciones: obraData.observaciones,
      docfile: obraData.docfile
    };
    
    console.log('[ObraService] Updating obra with request:', request);
    return this.proxyService.post<ObrasFullResponse>(environment.apiBaseUrl + this.apiUrl, request);
  }

  /**
   * Activate an existing obra
   * @param idObra ID of the obra to activate
   * @returns Observable with the activation response
   */
  activateObra(idObra: string | number): Observable<ObrasFullResponse> {
    // Request body for activating an obra
    const request = {
      caso: 'Activa',
      idObra: idObra
    };
    
    console.log('[ObraService] Activating obra with request:', request);
    return this.proxyService.post<ObrasFullResponse>(environment.apiBaseUrl + this.apiUrl, request);
  }

  /**
   * Deactivate an existing obra (same as delete but for clarity)
   * @param idObra ID of the obra to deactivate
   * @returns Observable with the deactivation response
   */
   deactivateObra(idObra: string | number): Observable<ObrasFullResponse> {
    // Request body for deactivating an obra
    const request = {
      caso: 'Elimina',
      idObra: idObra
    };
    
    console.log('[ObraService] Deactivating obra with request:', request);
    return this.proxyService.post<ObrasFullResponse>(environment.apiBaseUrl + this.apiUrl, request);
  }
}
