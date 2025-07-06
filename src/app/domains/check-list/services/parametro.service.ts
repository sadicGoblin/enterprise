import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProxyService } from '../../../core/services/proxy.service';
import { 
  ParametroRequest, 
  ParametroResponse, 
  ParametroItem 
} from '../models/parametro.models';

// Interfaz para la creación de parámetros
export interface CreateParametroRequest {
  caso: string;
  idDet: number;
  idCab: number;
  nombre: string;
  alias: string;
  codigo: string;
  idPeriocidad: number;
  periocidad?: any;
  idCategoria: number;
  idParam: number;
}

export interface DeleteParametroRequest {
  caso: string;
  idDet: number;
}

// Interfaz para actualizar parámetros - utiliza la misma estructura que CreateParametroRequest
export interface UpdateParametroRequest extends CreateParametroRequest {}

@Injectable({
  providedIn: 'root'
})
export class ParametroService {
  // API endpoint path for Parametros
  private readonly apiEndpoint = '/ws/ParametrosSvcImpl.php';
  
  constructor(private proxyService: ProxyService) { }

  /**
   * Get parameters from API
   * @param idCab The cabinet ID to fetch (default: 5)
   * @returns Observable with array of parameter items
   */
  getParametros(idCab: number = 5): Observable<ParametroItem[]> {
    const request: ParametroRequest = {
      caso: 'DetalleConsulta',
      idCab: idCab
    };

    console.log("Calling parametros API with endpoint:", this.apiEndpoint);
    console.log("Calling parametros API with request:", request);
    
    return this.proxyService.post<ParametroResponse>(this.apiEndpoint, request)
      .pipe(
        map(response => {
          console.log(`[ParametroService] API Response:`, response);
          
          // Check if response is successful
          if (response.success === true && response.data && response.data.length > 0) {
            return response.data;
          }
          
          console.log(`[ParametroService] No data returned or error`);
          return [];
        })
      );
  }
  
  /**
   * Crea un nuevo parámetro
   * @param nombre Nombre del parámetro
   * @param idCab ID del gabinete (default: 5)
   * @returns Observable con la respuesta de la API
   */
  createParametro(nombre: string, idCab: number): Observable<any> {
    const requestBody: CreateParametroRequest = {
      "caso": "DetalleCrea",
      "idDet": 0,
      "idCab": idCab,
      "nombre": nombre,
      "alias": "",
      "codigo": "",
      "idPeriocidad": 0,
      "periocidad": null,
      "idCategoria": 0,
      "idParam": 0
    };

    console.log('Request body for creating parameter:', requestBody);
    
    return this.proxyService.post('/ws/ParametrosSvcImpl.php', requestBody);
  }
  
  /**
   * Elimina un parámetro por su ID
   * @param idDet ID del parámetro a eliminar
   * @returns Observable con la respuesta de la API
   */
  deleteParametro(idDet: number): Observable<any> {
    const requestBody: DeleteParametroRequest = {
      "caso": "DetalleElimina",
      "idDet": idDet
    };

    console.log('Request body for deleting parameter:', requestBody);
    
    return this.proxyService.post('/ws/ParametrosSvcImpl.php', requestBody);
  }
  
  /**
   * Actualiza un parámetro existente
   * @param requestBody Objeto con los datos para actualizar el parámetro
   * @returns Observable con la respuesta de la API
   */
  updateParametro(requestBody: UpdateParametroRequest): Observable<any> {
    console.log('Request body for updating parameter:', requestBody);
    
    return this.proxyService.post('/ws/ParametrosSvcImpl.php', requestBody);
  }
}
