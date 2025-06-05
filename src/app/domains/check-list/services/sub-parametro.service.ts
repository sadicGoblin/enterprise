import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ProxyService } from '../../../core/services/proxy.service';
import { 
  SubParametroRequest, 
  SubParametroResponse, 
  SubParametroItem 
} from '../models/sub-parametro.models';
import { SelectOption } from '../../../shared/controls/custom-select/custom-select.component';

@Injectable({
  providedIn: 'root'
})
export class SubParametroService {
  // Complete API path for SubParametros endpoint
  private readonly apiEndpoint = '/ws/SubParametrosSvcImpl.php';

  // ID mapping for different parameter types
  private readonly PARAMETER_IDS = {
    CARGO: 15,
    TIPO_ACCESO: 16,
    EMPRESA: 17
  };

  constructor(private http: HttpClient, private proxyService: ProxyService) { }

  /**
   * Get cargo options from API
   * @returns Observable with SelectOption array for cargo dropdown
   */
  getCargos(): Observable<SelectOption[]> {
    return this.getSubParametros(this.PARAMETER_IDS.CARGO);
  }

  /**
   * Get tipo acceso options from API
   * @returns Observable with SelectOption array for tipo acceso dropdown
   */
  getTipoAccesos(): Observable<SelectOption[]> {
    return this.getSubParametros(this.PARAMETER_IDS.TIPO_ACCESO);
  }

  /**
   * Get empresa options from API
   * @returns Observable with SelectOption array for empresa dropdown
   */
  getEmpresas(): Observable<SelectOption[]> {
    return this.getSubParametros(this.PARAMETER_IDS.EMPRESA);
  }

  /**
   * Get all parameter options at once (cargo, tipo acceso, empresa)
   * @returns Observable with object containing all options
   */
  getAllParametros(): Observable<{
    cargos: SelectOption[],
    tipoAccesos: SelectOption[],
    empresas: SelectOption[]
  }> {
    return forkJoin({
      cargos: this.getCargos(),
      tipoAccesos: this.getTipoAccesos(),
      empresas: this.getEmpresas()
    });
  }

  /**
   * Get sub-parameters from API
   * @param idEnt Parameter ID to fetch
   * @returns Observable with SelectOption array formatted for custom-select
   */
  private getSubParametros(idEnt: number): Observable<SelectOption[]> {
    const request: SubParametroRequest = {
      caso: 'SubParametroConsulta',
      idEnt: idEnt
    };

    // Use Angular's proxy system to avoid CORS issues
    console.log("calling subparametros api with endpoint: ",this.apiEndpoint)
    console.log("calling subparametros api with request: ",request)
    return this.proxyService.post<SubParametroResponse>(this.apiEndpoint, request)
      .pipe(
        map(response => {
          console.log(`[SubParametroService] API Response for idEnt=${idEnt}:`, response);
          
          // Check if response is successful (handle both new and legacy API formats)
          if ((response.success === true || response.glosa === 'Ok') && response.data && response.data.length > 0) {
            // Transform API response to SelectOption format
            const mappedOptions = response.data.map(item => {
              const option = {
                value: item.IdSubParam, // Use IdSubParam as value
                label: item.Nombre,     // Using Nombre as display label
                idSubParam: parseInt(item.IdSubParam, 10) // Include IdSubParam for profile API calls
              };
              console.log(`[SubParametroService] Mapped option:`, option);
              return option;
            });
            
            console.log(`[SubParametroService] All mapped options:`, mappedOptions);
            return mappedOptions;
          }
          console.log(`[SubParametroService] No data returned or error for idEnt=${idEnt}`);
          return [];
        })
      );
  }
}
