import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
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
  // API URL using relative path that will be handled by the proxy
  private readonly apiUrl = '/ws/SubParametrosSvcImpl.php';

  // ID mapping for different parameter types
  private readonly PARAMETER_IDS = {
    CARGO: 15,
    TIPO_ACCESO: 16,
    EMPRESA: 17
  };

  constructor(private http: HttpClient) { }

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

    return this.http.post<SubParametroResponse>(this.apiUrl, request)
      .pipe(
        map(response => {
          // Check if response is successful
          if (response.glosa === 'Ok' && response.data && response.data.length > 0) {
            // Transform API response to SelectOption format
            return response.data.map(item => ({
              value: item.IdDet, // Using IdDet as value
              label: item.Nombre // Using Nombre as display label
            }));
          }
          return [];
        })
      );
  }
}
