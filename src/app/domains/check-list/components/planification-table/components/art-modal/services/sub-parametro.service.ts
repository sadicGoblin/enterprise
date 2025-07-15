import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../../../../../core/services/proxy.service';
import { 
  SubParametroRequest, 
  SubParametroResponse 
} from '../models/sub-parametro.model';
import { environment } from '../../../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubParametroService {
  private readonly API_ENDPOINT = '/ws/SubParametrosSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Obtiene los subparámetros según el ID de entidad
   * @param idEnt ID de la entidad a consultar
   * @returns Observable con la respuesta de la API
   */
  getSubParametros(idEnt: number): Observable<SubParametroResponse> {
    const requestBody: SubParametroRequest = {
      caso: 'SubParametroConsulta',
      idEnt: idEnt
    };

    return this.proxyService.post<SubParametroResponse>(environment.apiBaseUrl + this.API_ENDPOINT, requestBody);
  }
}
