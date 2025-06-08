import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProxyService } from '../../../core/services/proxy.service';
import { 
  ParametroRequest, 
  ParametroResponse, 
  ParametroItem 
} from '../models/parametro.models';

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
}
