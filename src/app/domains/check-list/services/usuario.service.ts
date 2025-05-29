import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioRequest, UsuarioResponse, UsuarioItem } from '../models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  // API URL using relative path that will be handled by the proxy
  private readonly apiUrl = '/ws/UsuarioSvcImpl.php';

  constructor(private http: HttpClient) { }

  /**
   * Get all users from API
   * @returns Observable with user data
   */
  getAllUsers(): Observable<UsuarioResponse> {
    const request: UsuarioRequest = {
      caso: 'Consultas'
    };

    return this.http.post<UsuarioResponse>(this.apiUrl, request);
  }
}
