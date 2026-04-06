import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';
import { environment } from '../../../../environments/environment';
import {
  MasaLaboralApiResponse,
  CrearMasaLaboralRequest,
  ActualizarMasaLaboralRequest,
  ListarMasaLaboralRequest,
  EliminarMasaLaboralRequest
} from '../pages/accidents/models/masa-laboral.model';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MasaLaboralService {
  private readonly apiEndpoint = '/ws/MasaLaboralSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Listar registros de masa laboral con filtros opcionales
   */
  listar(filters?: Partial<Omit<ListarMasaLaboralRequest, 'caso'>>): Observable<ApiResponse<MasaLaboralApiResponse[]>> {
    const request: ListarMasaLaboralRequest = {
      caso: 'Consultas',
      ...filters
    };
    return this.proxyService.post<ApiResponse<MasaLaboralApiResponse[]>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Obtener un registro específico de masa laboral
   */
  obtener(idMasaLaboral: number): Observable<ApiResponse<MasaLaboralApiResponse>> {
    const request = {
      caso: 'Obtener',
      IdMasaLaboral: idMasaLaboral
    };
    return this.proxyService.post<ApiResponse<MasaLaboralApiResponse>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Crear un nuevo registro de masa laboral
   */
  crear(data: Omit<CrearMasaLaboralRequest, 'caso'>): Observable<ApiResponse<MasaLaboralApiResponse>> {
    const request: CrearMasaLaboralRequest = {
      caso: 'Crea',
      ...data
    };
    return this.proxyService.post<ApiResponse<MasaLaboralApiResponse>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Actualizar un registro existente de masa laboral
   */
  actualizar(data: Omit<ActualizarMasaLaboralRequest, 'caso'>): Observable<ApiResponse<MasaLaboralApiResponse>> {
    const request: ActualizarMasaLaboralRequest = {
      caso: 'Actualiza',
      ...data
    };
    return this.proxyService.post<ApiResponse<MasaLaboralApiResponse>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Eliminar un registro de masa laboral
   */
  eliminar(idMasaLaboral: number): Observable<ApiResponse<any>> {
    const request: EliminarMasaLaboralRequest = {
      caso: 'Elimina',
      IdMasaLaboral: idMasaLaboral
    };
    return this.proxyService.post<ApiResponse<any>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Obtener lista de años disponibles
   */
  obtenerAniosDisponibles(): Observable<ApiResponse<{ Anio: string }[]>> {
    const request = {
      caso: 'ObtenerAnios'
    };
    return this.proxyService.post<ApiResponse<{ Anio: string }[]>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Verificar si existe un registro para empresa y periodo
   */
  verificarExistencia(tipoEmpresa: string, periodo: string, idMasaLaboralExcluir?: number): Observable<ApiResponse<{ existe: boolean }>> {
    const request: any = {
      caso: 'VerificarExistencia',
      TipoEmpresa: tipoEmpresa,
      Periodo: periodo
    };
    if (idMasaLaboralExcluir) {
      request.IdMasaLaboralExcluir = idMasaLaboralExcluir;
    }
    return this.proxyService.post<ApiResponse<{ existe: boolean }>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }
}
