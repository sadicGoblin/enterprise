import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';
import { ObraRequest, ObrasFullResponse, ObrasSimpleResponse } from '../models/obra.models';

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
    return this.proxyService.post<ObrasFullResponse>(this.apiUrl, request);
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
    return this.proxyService.post<ObrasSimpleResponse>(this.apiUrl, request);
  }

  // Additional methods for CRUD operations can be added here
  // createObra, updateObra, deleteObra, etc.
}
