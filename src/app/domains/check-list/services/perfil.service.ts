import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProxyService } from '../../../core/services/proxy.service';

export interface PerfilPantallaRequest {
  caso: string;
  IdPerfil: number;
  IdPantalla: number;
  IdPerfilPantalla: number;
  Acceso: boolean;
  Grabar: boolean;
  Pantalla: string | null;
}

export interface PantallaPerfil {
  IdPerfilPantalla: number;
  IdPerfil: number;
  IdPantalla: number;
  Acceso: boolean;
  Grabar: boolean;
  NombrePantalla: string;
}

export interface PerfilPantallaResponse {
  codigo: number;
  glosa: string;
  data: PantallaPerfil[];
}

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  // API endpoint for profile-related operations
  private readonly apiEndpoint = '/ws/PerfilSvcImpl.php';
  
  constructor(private http: HttpClient, private proxyService: ProxyService) {}
  
  /**
   * Get screens permissions for a specific profile ID
   * @param idPerfil The profile ID to query
   */
  getScreensForProfile(idPerfil: number): Observable<PantallaPerfil[]> {
    // Make sure idPerfil is a number
    const numericIdPerfil = Number(idPerfil);
    
    if (isNaN(numericIdPerfil)) {
      console.error(`[PerfilService] Invalid idPerfil value: ${idPerfil}, type: ${typeof idPerfil}`);
      return throwError(() => new Error('Invalid profile ID'));
    }
    
    const requestData: PerfilPantallaRequest = {
      caso: 'Consulta',
      IdPerfil: numericIdPerfil,
      IdPantalla: 0,
      IdPerfilPantalla: 0,
      Acceso: false,
      Grabar: false,
      Pantalla: null
    };
    
    console.log(`[PerfilService] Fetching screens for profile ID: ${numericIdPerfil}`);
    console.log(`[PerfilService] Request data:`, JSON.stringify(requestData));
    console.log(`[PerfilService] CRITICAL: IdPerfil being sent to API:`, numericIdPerfil);
    
    return this.proxyService.post<PerfilPantallaResponse>(this.apiEndpoint, requestData)
      .pipe(
        map(response => {
          console.log('[PerfilService] API response:', response);
          
          if (response.codigo === 0 && response.data) {
            // Transform API response - ensure proper types and property names
            const transformedData = response.data.map(item => {
              // Cast to any to safely access potential properties that might exist in API response
              const apiItem = item as any;
              
              // Find the screen name (check various possible property names)
              const screenName = apiItem.NombrePantalla || apiItem.Pantalla || apiItem.Nombre || `Screen ${apiItem.IdPantalla}`;
              
              // Make sure boolean values are actual booleans
              const acceso = typeof item.Acceso === 'boolean' ? item.Acceso : 
                             item.Acceso === 1 || item.Acceso === '1' || item.Acceso === 'true';
                             
              const grabar = typeof item.Grabar === 'boolean' ? item.Grabar : 
                            item.Grabar === 1 || item.Grabar === '1' || item.Grabar === 'true';
              
              console.log(`[PerfilService] Transformed item: ID=${item.IdPantalla}, Screen=${screenName}, Acceso=${acceso}, Grabar=${grabar}`);
              
              return {
                ...item,
                NombrePantalla: screenName,
                Acceso: acceso,
                Grabar: grabar
              };
            });
            
            console.log('[PerfilService] Transformed data:', transformedData);
            return transformedData;
          } else {
            console.error(`PerfilService: API error: ${response.glosa}`);
            return [];
          }
        })
      );
  }
  
  /**
   * Update screen permissions for a profile
   * @param idPerfil The profile ID
   * @param idPantalla The screen ID
   * @param idPerfilPantalla The profile-screen relation ID
   * @param acceso Whether the profile has access to the screen
   * @param grabar Whether the profile has write access to the screen
   */
  updateScreenPermission(
    idPerfil: number,
    idPantalla: number,
    idPerfilPantalla: number,
    acceso: boolean,
    grabar: boolean
  ): Observable<boolean> {
    const requestData: PerfilPantallaRequest = {
      caso: 'Graba',
      IdPerfil: idPerfil,
      IdPantalla: idPantalla,
      IdPerfilPantalla: idPerfilPantalla,
      Acceso: acceso,
      Grabar: grabar,
      Pantalla: null
    };
    
    console.log(`PerfilService: Updating screen permission:`, requestData);
    
    return this.proxyService.post<PerfilPantallaResponse>(this.apiEndpoint, requestData)
      .pipe(
        map(response => {
          console.log('PerfilService: Update response:', response);
          return response.codigo === 0;
        })
      );
  }
}
