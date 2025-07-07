import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProxyService } from '../../../core/services/proxy.service';

export interface PerfilPantallaRequest {
  caso: string;
  IdPerfil: string | number;
  IdPantalla: string | number;
  IdPerfilPantalla: string | number;
  Acceso: string | boolean;
  Grabar: string | boolean;
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
  success: boolean;
  code: number;
  message: string;
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
    // Make sure idPerfil is a number and then convert to string for consistency
    const numericIdPerfil = Number(idPerfil);
    
    if (isNaN(numericIdPerfil)) {
      console.error(`[PerfilService] Invalid idPerfil value: ${idPerfil}, type: ${typeof idPerfil}`);
      return throwError(() => new Error('Invalid profile ID'));
    }
    
    // Usar el mismo formato que en updateScreenPermission para consistencia
    const requestData = {
      caso: 'Consulta',
      IdPerfil: String(numericIdPerfil),  // Convertir a string como en updateScreenPermission
      IdPantalla: "0",                    // Usar string en lugar de número
      IdPerfilPantalla: "0",              // Usar string en lugar de número
      Acceso: "0",                        // Usar string en lugar de booleano
      Grabar: "0",                        // Usar string en lugar de booleano
      Pantalla: null
    };
    
    console.log(`[PerfilService] Fetching screens for profile ID: ${numericIdPerfil}`);
    console.log(`[PerfilService] Request data:`, JSON.stringify(requestData));
    console.log(`[PerfilService] CRITICAL: IdPerfil being sent to API:`, requestData.IdPerfil);
    
    return this.proxyService.post<PerfilPantallaResponse>(this.apiEndpoint, requestData)
      .pipe(
        map(response => {
          console.log('[PerfilService] API response:', response);
          
          if ((response.success === true || (response as any).code === 200) && response.data) {
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
                Grabar: grabar,
                // Agregar campo para mantener el ID de pantalla como string para comparaciones consistentes
                IdPantallaStr: String(item.IdPantalla) 
              };
            });
            
            // Ordenar los datos por NombrePantalla para mantener un orden consistente
            const sortedData = transformedData.sort((a, b) => 
              a.NombrePantalla.localeCompare(b.NombrePantalla, undefined, {sensitivity: 'base'})
            );
            
            console.log('[PerfilService] Transformed and sorted data:', sortedData);
            return sortedData;
          } else {
            console.error(`PerfilService: API error: ${response.message}`);
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
    // Convertir booleanos a strings "1"/"0" como espera la API
    const accesoStr = acceso ? "1" : "0";
    const grabarStr = grabar ? "1" : "0";
    
    const requestData = {
      caso: 'Modifica', // Cambiado de 'Graba' a 'Modifica' como muestra el ejemplo
      IdPerfil: String(idPerfil), // Convertir a string
      IdPantalla: String(idPantalla), // Convertir a string
      IdPerfilPantalla: String(idPerfilPantalla), // Convertir a string
      Acceso: accesoStr,
      Grabar: grabarStr,
      Pantalla: null
    };
    
    console.log(`PerfilService: Updating screen permission:`, requestData);
    
    return this.proxyService.post<PerfilPantallaResponse>(this.apiEndpoint, requestData)
      .pipe(
        map(response => {
          console.log('PerfilService: Update response:', response);
          return response.success === true;
        })
      );
  }
}
