import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioRequest, UsuarioResponse, UsuarioItem } from '../models/usuario.models';
import { ProxyService } from '../../../core/services/proxy.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  // Complete API path for Usuario endpoint
  private readonly apiEndpoint = '/ws/UsuarioSvcImpl.php';
  
  constructor(private http: HttpClient, private proxyService: ProxyService) { }

  /**
   * Get all users from API
   * @returns Observable with user data
   */
  getAllUsers(): Observable<UsuarioResponse> {
    const request: UsuarioRequest = {
      caso: 'Consultas'
    };

    console.log('Calling usuario API endpoint:', this.apiEndpoint);
    
    // Use Angular's proxy system to avoid CORS issues
    return this.proxyService.post<UsuarioResponse>(this.apiEndpoint, request);
  }

  /**
   * Get user works from API
   * @param userId User ID to fetch works for
   * @returns Observable with user works data
   */
  getUserWorks(userId: number): Observable<any> {
    const request = {
      caso: 'ConsultaObras',
      idUsuario: userId,
      usuario: null
    };

    console.log('Fetching works for user ID:', userId, 'with endpoint:', this.apiEndpoint);
    
    // Use Angular's proxy system to avoid CORS issues
    return this.proxyService.post<any>(this.apiEndpoint, request);
  }
}
