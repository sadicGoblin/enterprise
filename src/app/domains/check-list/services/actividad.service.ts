import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';
import { ActividadRequest, InspeccionSSTMAResponse, ControlPlanification } from '../models/actividad.models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  // API URL using relative path that will be handled by the proxy
  private readonly apiUrl = '/ws/ActividadSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Consulta inspecciones SSTMA por idObra
   * @param idObra ID de la obra para consultar inspecciones
   * @returns Observable con datos de inspecciones SSTMA
   */
  getInspeccionesSSTMA(idObra: number): Observable<InspeccionSSTMAResponse> {
    const request: ActividadRequest = {
      caso: 'ConsultaInspeccionSSTMAidObra',
      idObra: idObra
    };
    
    console.log(`[ActividadService] Consultando inspecciones SSTMA para obra ${idObra}:`, request);
    return this.proxyService.post<InspeccionSSTMAResponse>(environment.apiBaseUrl + this.apiUrl, request);
  }

  getcontrolPlanificacion(idControl: number, period: string): Observable<any> {
    let apiUrl = '/ws/PlanificacionSvcImpl.php';
    const request: ControlPlanification = {
      caso: 'ControlPlanificacion',
      idControl: idControl,
      periodo: parseInt(period)
    };
    console.log(`[ActividadService] Consultando control planificación para control ${idControl}:`, request);
    return this.proxyService.post<any>(environment.apiBaseUrl + apiUrl, request);
  }
}
