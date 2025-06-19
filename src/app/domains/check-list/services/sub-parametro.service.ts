import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

// Interfaces for Etapas Constructivas API
export interface EtapaConstructivaItem {
  idEtapaConstructiva: string;
  codigo: string;
  nombre: string;
  idObra: string;
}

export interface EtapasConstructivasResponse {
  success: boolean;
  code: number;
  message: string;
  data: EtapaConstructivaItem[];
}

// Interfaces for Subprocesos API
export interface SubprocesoItem {
  idEtapaConstructiva: string;
  idSubproceso: string;
  codigo: string;
  nombre: string;
}

export interface SubprocesoResponse {
  success: boolean;
  code: number;
  message: string;
  data: SubprocesoItem[];
}

// Interfaces for Ambitos API
export interface AmbitoItem {
  IdAmbito: string;
  codigo: string;
  nombre: string;
}

export interface AmbitosResponse {
  success: boolean;
  code: number;
  message: string;
  data: AmbitoItem[];
}
import { environment } from '../../../../environments/environment';
import { ProxyService } from '../../../core/services/proxy.service';
import { 
  SubParametroRequest, 
  SubParametroResponse, 
  SubParametroItem 
} from '../models/sub-parametro.models';

// Interface for the Obras API response structure
interface ObraItem {
  IdObra: string;
  Obra: string;
}

interface ObrasResponse {
  success: boolean;
  code: number;
  message: string;
  data: ObraItem[];
}
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
  getSubParametros(idEnt: number): Observable<SelectOption[]> {
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

  addEtapaConstructiva(etapaData: { codigo: string; nombre: string }, idObra: string): Observable<any> {
    const endpoint = '/ws/EtapaConstructivaSvcImpl.php'; // Assuming same endpoint
    const requestBody = {
      caso: 'InsertarEtapaConstructiva', // Assuming this 'caso'
      idObra: parseInt(idObra, 10),
      codigo: etapaData.codigo,
      nombre: etapaData.nombre,
      // Potentially other fields like idEtapaConstructiva: 0 for new ones
    };
    console.log('[SubParametroService] Adding Etapa Constructiva with body:', requestBody);
    return this.proxyService.post<any>(endpoint, requestBody).pipe(
      map(response => {
        console.log('[SubParametroService] Add Etapa Constructiva response:', response);
        // Handle success/error based on typical response structure
        if (response && response.success) {
          return response; // Or response.data if new item is returned
        }
        throw new Error('Failed to add Etapa Constructiva: ' + (response?.glosa || 'Unknown error'));
      }),
      catchError((error: any) => {
        console.error('[SubParametroService] API Error adding Etapa Constructiva:', error);
        return throwError(() => new Error('API Error adding Etapa Constructiva'));
      })
    );
  }

  updateEtapaConstructiva(etapaData: EtapaConstructivaItem): Observable<any> {
    const endpoint = '/ws/EtapaConstructivaSvcImpl.php'; // Assuming same endpoint
    const requestBody = {
      caso: 'ActualizarEtapaConstructiva', // Assuming this 'caso'
      idEtapaConstructiva: parseInt(etapaData.idEtapaConstructiva, 10),
      idObra: parseInt(etapaData.idObra, 10),
      codigo: etapaData.codigo,
      nombre: etapaData.nombre
    };
    console.log('[SubParametroService] Updating Etapa Constructiva with body:', requestBody);
    return this.proxyService.post<any>(endpoint, requestBody).pipe(
      map(response => {
        console.log('[SubParametroService] Update Etapa Constructiva response:', response);
        if (response && response.success) {
          return response;
        }
        throw new Error('Failed to update Etapa Constructiva: ' + (response?.glosa || 'Unknown error'));
      }),
      catchError((error: any) => {
        console.error('[SubParametroService] API Error updating Etapa Constructiva:', error);
        return throwError(() => new Error('API Error updating Etapa Constructiva'));
      })
    );
  }

  deleteEtapaConstructiva(idEtapaConstructiva: string): Observable<any> {
    const endpoint = '/ws/EtapaConstructivaSvcImpl.php'; // Assuming same endpoint
    const requestBody = {
      caso: 'EliminarEtapaConstructiva', // Assuming this 'caso'
      idEtapaConstructiva: parseInt(idEtapaConstructiva, 10) // API might expect number
    };
    console.log('[SubParametroService] Deleting Etapa Constructiva with body:', requestBody);
    return this.proxyService.post<any>(endpoint, requestBody).pipe(
      map(response => {
        console.log('[SubParametroService] Delete Etapa Constructiva response:', response);
        if (response && response.success) {
          return response;
        }
        throw new Error('Failed to delete Etapa Constructiva: ' + (response?.glosa || 'Unknown error'));
      }),
      catchError((error: any) => {
        console.error('[SubParametroService] API Error deleting Etapa Constructiva:', error);
        return throwError(() => new Error('API Error deleting Etapa Constructiva'));
      })
    );
  }

  getEtapasConstructivas(): Observable<EtapaConstructivaItem[]> {
    const endpoint = '/ws/EtapaConstructivaSvcImpl.php';
    const requestBody = {
      caso: 'ConsultaEtapaConstructiva',
      idEtapaConstructiva: 0,
      idObra: 0,
      codigo: 0,
      nombre: null,
    };
    return this.proxyService
      .post<EtapasConstructivasResponse>(endpoint, requestBody)
      .pipe(
        map((response) => {
          if (response && response.success && response.data) {
            return response.data;
          } else {
            console.error(
              '[SubParametroService] Error fetching Etapas Constructivas or invalid response:',
              response
            );
            return []; // Return empty array on error or invalid response
          }
        }),
        catchError((error: any) => {
          console.error(
            '[SubParametroService] API Error fetching Etapas Constructivas:',
            error
          );
          return of([]); // Return empty array on API error
        })
      );
  }

  addSubproceso(subprocesoData: { codigo: string; nombre: string }, idEtapaConstructiva: string): Observable<any> {
    const endpoint = '/ws/SubprocesoConstructivoSvcImpl.php'; // Assuming a similar endpoint structure
    const requestBody = {
      caso: 'InsertarSubproceso', // Assuming this 'caso'
      idEtapaConstructiva: parseInt(idEtapaConstructiva, 10),
      codigo: subprocesoData.codigo,
      nombre: subprocesoData.nombre
      // idSubproceso will be generated by the backend
    };
    console.log('[SubParametroService] Adding Subproceso with body:', requestBody);
    return this.proxyService.post<any>(endpoint, requestBody).pipe(
      map(response => {
        console.log('[SubParametroService] Add Subproceso response:', response);
        if (response && response.success) {
          return response; // Assuming backend returns the newly created item or success status
        }
        throw new Error('Failed to add Subproceso: ' + (response?.glosa || 'Unknown error'));
      }),
      catchError((error: any) => {
        console.error('[SubParametroService] API Error adding Subproceso:', error);
        return throwError(() => new Error('API Error adding Subproceso'));
      })
    );
  }

  deleteSubproceso(idSubproceso: string): Observable<any> {
    const endpoint = '/ws/SubprocesoConstructivoSvcImpl.php'; // Assuming same endpoint
    const requestBody = {
      caso: 'EliminarSubproceso', // Assuming this 'caso'
      idSubproceso: parseInt(idSubproceso, 10) // API might expect number
    };
    console.log('[SubParametroService] Deleting Subproceso with body:', requestBody);
    return this.proxyService.post<any>(endpoint, requestBody).pipe(
      map(response => {
        console.log('[SubParametroService] Delete Subproceso response:', response);
        if (response && response.success) {
          return response;
        }
        throw new Error('Failed to delete Subproceso: ' + (response?.glosa || 'Unknown error'));
      }),
      catchError((error: any) => {
        console.error('[SubParametroService] API Error deleting Subproceso:', error);
        return throwError(() => new Error('API Error deleting Subproceso'));
      })
    );
  }

  updateSubproceso(subprocesoData: SubprocesoItem): Observable<any> {
    const endpoint = '/ws/SubprocesoConstructivoSvcImpl.php'; // Assuming same endpoint
    const requestBody = {
      caso: 'ActualizarSubproceso', // Assuming this 'caso'
      idSubproceso: parseInt(subprocesoData.idSubproceso, 10),
      idEtapaConstructiva: parseInt(subprocesoData.idEtapaConstructiva, 10),
      codigo: subprocesoData.codigo,
      nombre: subprocesoData.nombre
    };
    console.log('[SubParametroService] Updating Subproceso with body:', requestBody);
    return this.proxyService.post<any>(endpoint, requestBody).pipe(
      map(response => {
        console.log('[SubParametroService] Update Subproceso response:', response);
        if (response && response.success) {
          return response;
        }
        throw new Error('Failed to update Subproceso: ' + (response?.glosa || 'Unknown error'));
      }),
      catchError((error: any) => {
        console.error('[SubParametroService] API Error updating Subproceso:', error);
        return throwError(() => new Error('API Error updating Subproceso'));
      })
    );
  }

  getSubprocesosPorEtapa(idEtapaConstructiva: number): Observable<SubprocesoItem[]> {
    const endpoint = '/ws/EtapaConstructivaSvcImpl.php';
    const requestBody = {
      caso: 'ConsultaSubProcesos',
      idEtapaConstructiva: idEtapaConstructiva,
      idSubProceso: 0,
      codigo: 0,
      nombre: null,
    };
    return this.proxyService
      .post<SubprocesoResponse>(endpoint, requestBody)
      .pipe(
        map((response) => {
          if (response && response.success && response.data) {
            return response.data;
          } else {
            console.error(
              '[SubParametroService] Error fetching Subprocesos or invalid response:',
              response
            );
            return []; // Return empty array on error or invalid response
          }
        }),
        catchError((error: any) => {
          console.error(
            '[SubParametroService] API Error fetching Subprocesos:',
            error
          );
          return of([]); // Return empty array on API error
        })
      );
  }

  /**
   * Get ambitos from API
   * @returns Observable with array of AmbitoItem
   */
  getAmbitos(): Observable<AmbitoItem[]> {
    const endpoint = '/ws/AmbitosSvcImpl.php';
    const requestBody = {
      caso: 'ConsultaAmbitos',
      idAmbito: 0,
      nombre: null,
      codigo: 0
    };
    
    console.log('[SubParametroService] Fetching Ambitos with URL:', 'https://inarco-ssoma.favric.cl' + endpoint);
    console.log('[SubParametroService] Fetching Ambitos with body:', requestBody);
    
    return this.proxyService
      .post<AmbitosResponse>(endpoint, requestBody)
      .pipe(
        tap(response => console.log('[SubParametroService] Raw Ambitos API response:', response)),
        map((response) => {
          if (response && response.success && response.data) {
            console.log('[SubParametroService] Processed Ambitos data:', response.data);
            return response.data;
          } else {
            console.error(
              '[SubParametroService] Error fetching Ambitos or invalid response:',
              response
            );
            return []; // Return empty array on error or invalid response
          }
        }),
        catchError((error: any) => {
          console.error(
            '[SubParametroService] API Error fetching Ambitos:',
            error
          );
          return of([]); // Return empty array on API error
        })
      );
  }
}
