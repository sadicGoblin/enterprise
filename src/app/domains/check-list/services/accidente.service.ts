import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  AccidenteApiResponse,
  AccidenteDropdowns,
  EstadisticasApiResponse,
  CrearAccidenteRequest,
  CrearAccidenteResponse,
  ActualizarAccidenteRequest,
  ListarAccidentesRequest
} from '../pages/accidents/models/accident.model';

@Injectable({
  providedIn: 'root'
})
export class AccidenteService {
  private readonly apiEndpoint = '/ws/AccidentesSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Obtener todos los dropdowns para el formulario de accidentes
   * @param noCache Si es true, agrega timestamp para evitar cache del servidor
   */
  getDropdowns(noCache: boolean = false): Observable<ApiResponse<AccidenteDropdowns>> {
    const request: any = { caso: 'ConsultaDropdowns' };
    if (noCache) {
      request._nocache = Date.now(); // Forzar bypass de cache
    }
    console.log('[AccidenteService] getDropdowns REQUEST:', JSON.stringify(request));
    return this.proxyService.post<ApiResponse<AccidenteDropdowns>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Crear un nuevo accidente
   */
  crearAccidente(data: CrearAccidenteRequest): Observable<ApiResponse<CrearAccidenteResponse>> {
    return this.proxyService.post<ApiResponse<CrearAccidenteResponse>>(
      environment.apiBaseUrl + this.apiEndpoint, data
    );
  }

  /**
   * Actualizar un accidente existente
   */
  actualizarAccidente(data: ActualizarAccidenteRequest): Observable<ApiResponse<any>> {
    return this.proxyService.post<ApiResponse<any>>(
      environment.apiBaseUrl + this.apiEndpoint, data
    );
  }

  /**
   * Obtener un accidente por ID
   */
  getAccidente(idAccidente: number): Observable<ApiResponse<AccidenteApiResponse>> {
    const request = { caso: 'Consulta', IdAccidente: idAccidente };
    return this.proxyService.post<ApiResponse<AccidenteApiResponse>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Listar accidentes con filtros opcionales
   */
  listarAccidentes(filters?: Partial<Omit<ListarAccidentesRequest, 'caso'>>): Observable<ApiResponse<AccidenteApiResponse[]>> {
    const request: ListarAccidentesRequest = {
      caso: 'Consultas',
      limit: 100,
      offset: 0,
      ...filters
    };
    return this.proxyService.post<ApiResponse<AccidenteApiResponse[]>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Eliminar accidente (soft delete → Estado = 'Anulado')
   */
  eliminarAccidente(idAccidente: number): Observable<ApiResponse<any>> {
    const request = { caso: 'Elimina', IdAccidente: idAccidente };
    return this.proxyService.post<ApiResponse<any>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Cambiar estado de un accidente
   */
  cambiarEstado(idAccidente: number, estado: string): Observable<ApiResponse<any>> {
    const request = { caso: 'Activa', IdAccidente: idAccidente, Estado: estado };
    return this.proxyService.post<ApiResponse<any>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Obtener estadísticas de accidentes
   */
  getEstadisticas(filters?: { IdObra?: number; FechaDesde?: string; FechaHasta?: string }): Observable<ApiResponse<EstadisticasApiResponse>> {
    const request = { caso: 'ConsultaEstadisticas', ...filters };
    return this.proxyService.post<ApiResponse<EstadisticasApiResponse>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Crear un nuevo elemento en una tabla de catálogo (botón +)
   */
  crearCatalogo(tabla: string, nombre: string, descripcion?: string, extra?: Record<string, any>): Observable<ApiResponse<{ id: number; nombre: string; exists: boolean }>> {
    const request: any = { caso: 'CreaCatalogo', tabla, Nombre: nombre };
    if (descripcion) {
      request.Descripcion = descripcion;
    }
    if (extra) {
      request.extra = extra;
    }
    console.log('[AccidenteService] crearCatalogo REQUEST:', JSON.stringify(request));
    return this.proxyService.post<ApiResponse<{ id: number; nombre: string; exists: boolean }>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }

  /**
   * Generar número de accidente
   */
  generarNumero(idObra: number, fechaAccidente: string): Observable<ApiResponse<string>> {
    const request = { caso: 'GenerarNumero', IdObra: idObra, FechaAccidente: fechaAccidente };
    return this.proxyService.post<ApiResponse<string>>(
      environment.apiBaseUrl + this.apiEndpoint, request
    );
  }
}
