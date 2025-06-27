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
  
  /**
   * Save user works to API
   * @param requestBody Object containing case, userId, and data array with works to update
   * @returns Observable with API response
   */
  saveUserWorks(requestBody: any): Observable<any> {
    console.log('Saving user works:', requestBody);
    
    // El endpoint es el mismo que para getUserWorks
    return this.proxyService.post<any>(this.apiEndpoint, requestBody);
  }
  
  /**
   * Crea o actualiza un usuario en el sistema
   * @param userData Datos del usuario a crear/actualizar
   * @returns Observable con la respuesta del API
   */
  createUpdateUser(userData: {
    caso: string,
    usuario: string,
    nombre: string,
    idCargo: number | string,
    idPerfil: number | string,
    idTipoAcceso: number | string,
    idEmpresaContratista: number | string,
    eMail: string,
    celular: string,
    clave: string
  }): Observable<any> {
    // Construir el request siguiendo el patrón de obra.service.ts
    const request = {
      caso: userData.caso,
      usuario: userData.usuario,
      nombre: userData.nombre,
      idCargo: userData.idCargo,
      idPerfil: userData.idPerfil,
      idTipoAcceso: userData.idTipoAcceso,
      idEmpresaContratista: userData.idEmpresaContratista,
      eMail: userData.eMail,
      celular: userData.celular,
      clave: userData.clave
    };
    
    console.log('[UsuarioService] Creando/actualizando usuario con endpoint:', this.apiEndpoint);
    console.log('[UsuarioService] Request:', request);
    
    // Asegurarse de utilizar proxyService para que se aplique la configuración de proxy de Angular
    // y use el puerto correcto (8080)
    return this.proxyService.post<any>(this.apiEndpoint, request);
  }
}
