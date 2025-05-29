import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ObraRequest, ObraResponse } from '../models/obra.models';

@Injectable({
  providedIn: 'root'
})
export class ObraService {
  // API URL using relative path that will be handled by the proxy
  private readonly apiUrl = '/ws/ObrasSvcImpl.php';

  constructor(private http: HttpClient) {}

  /**
   * Get all obras from API
   * @returns Observable with obra data
   */
  getObras(): Observable<ObraResponse> {
    const request: ObraRequest = {
      caso: 'Consultas',
      idObra: 0
    };

    return this.http.post<ObraResponse>(this.apiUrl, request);
  }

  // Additional methods for CRUD operations can be added here
  // createObra, updateObra, deleteObra, etc.
}
