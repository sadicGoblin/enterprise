import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioRequest, UsuarioResponse, UsuarioItem } from '../models/usuario.models';
import { ProxyService } from '../../../core/services/proxy.service';
import { environment } from '../../../../environments/environment';

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
    return this.proxyService.post<UsuarioResponse>(environment.apiBaseUrl + this.apiEndpoint, request);
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
    return this.proxyService.post<any>(environment.apiBaseUrl + this.apiEndpoint, request);
  }
  
  /**
   * Save user works to API
   * @param requestBody Object containing case, userId, and data array with works to update
   * @returns Observable with API response
   */
  saveUserWorks(requestBody: any): Observable<any> {
    console.log('Saving user works:', requestBody);
    
    // El endpoint es el mismo que para getUserWorks
    return this.proxyService.post<any>(environment.apiBaseUrl + this.apiEndpoint, requestBody);
  }
  
  /**
   * Crea o actualiza un usuario en el sistema
   * @param userData Datos del usuario a crear/actualizar
   * @returns Observable con la respuesta del API
   */
  createUpdateUser(userData: {
    caso: string,
    idUsuario?: number, // Opcional para crear, requerido para modificar
    usuario: string,
    nombre: string,
    idCargo: number | string,
    idPerfil: number | string,
    idTipoAcceso: number | string,
    idEmpresaContratista: number | string,
    eMail: string,
    celular: string,
    clave?: string // Opcional (solo para crear)
  }): Observable<any> {
    // Construir el request siguiendo el formato exacto especificado
    const request: any = {
      "caso": userData.caso === 'Modifica' ? "Modifica" : "Crea",
      "usuario": userData.usuario,
      "nombre": userData.nombre,
      "idCargo": userData.idCargo,
      "idPerfil": userData.idPerfil,
      "idTipoAcceso": userData.idTipoAcceso,
      "idEmpresaContratista": userData.idEmpresaContratista,
      "eMail": userData.eMail,
      "celular": userData.celular
    };
    
    // Agregar idUsuario solo para Modifica
    if (userData.caso === 'Modifica' && userData.idUsuario) {
      request.idUsuario = userData.idUsuario;
    }
    
    // Agregar clave solo si está presente
    if (userData.clave) {
      request.clave = userData.clave;
    }
    
    console.log('Sending user create/update request:', request);
    return this.proxyService.post<any>(environment.apiBaseUrl + this.apiEndpoint, request);
  }
  
  // El método createControl ha sido movido a control.service.ts
  
  /**
   * Elimina un usuario del sistema
   * @param userId ID del usuario a eliminar
   * @returns Observable con la respuesta del API
   */
  deleteUser(userId: number): Observable<any> {
    // Construir el request siguiendo el formato exacto especificado
    const request = {
      "caso": "Elimina",
      "idUsuario": userId
    };
    
    console.log('[UsuarioService] Eliminando usuario...'); 
    console.log('[UsuarioService] Request body:', JSON.stringify(request));
    
    // Usar proxyService para aplicar la configuración de proxy de Angular
    return this.proxyService.post<any>(environment.apiBaseUrl + this.apiEndpoint, request);
  }

  /**
   * Toggle user active status (activate/deactivate)
   * @param userId ID del usuario
   * @param isActive Estado actual (será invertido)
   * @returns Observable con la respuesta del API
   */
  toggleUserStatus(userId: number, isActive: string): Observable<any> {
    // Determinar el caso según el estado actual
    // Si está activo (1), lo desactivamos con "Elimina"
    // Si está inactivo (0), lo activamos con "Activa"
    const caso = isActive === '1' ? 'Elimina' : 'Activa';
    
    const request = {
      "caso": caso,
      "idUsuario": userId
    };
    
    console.log(`[UsuarioService] ${caso === 'Elimina' ? 'Desactivando' : 'Activando'} usuario...`); 
    console.log('[UsuarioService] Request body:', JSON.stringify(request));
    
    return this.proxyService.post<any>(environment.apiBaseUrl + this.apiEndpoint, request);
  }
}
