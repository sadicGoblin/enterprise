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
    return this.proxyService.post<any>(this.apiEndpoint, request);
  }
  
  /**
   * Crea un nuevo control de actividad
   * @param controlData Datos del control a crear
   * @returns Observable con la respuesta del API
   */
  createControl(controlData: {
    caso: string,
    IdControl: number,
    idObra: number,
    obra: null,
    idUsuario: number,
    usuario: null,
    periodo: number,
    idEtapaConst: number,
    etapaConst: null,
    idSubProceso: number,
    subProceso: null,
    idAmbito: number,
    ambito: null,
    idActividad: number,
    actividad: null,
    idPeriocidad: number,
    periocidad: null,
    idCategoria: number,
    idParam: number,
    dias: null,
    fechaControl: string
  }): Observable<any> {
    // El endpoint para la creación de controles
    const controlEndpoint = '/ws/ControlSvcImpl.php';
    
    console.log('Creando nuevo control:', controlData);
    return this.proxyService.post<any>(controlEndpoint, controlData);
  }
  
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
    
    console.log('[UsuarioService] Eliminando usuario con ID:', userId);
    console.log('[UsuarioService] Request body:', JSON.stringify(request));
    
    // Usar proxyService para aplicar la configuración de proxy de Angular
    return this.proxyService.post<any>(this.apiEndpoint, request);
  }
}
