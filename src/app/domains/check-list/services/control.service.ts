import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';

@Injectable({
  providedIn: 'root'
})
export class ControlService {
  // El endpoint para la creación de controles
  private readonly apiEndpoint = '/ws/ControlSvcImpl.php';
  // El endpoint para consultar planificaciones completadas
  private readonly planificacionApiEndpoint = '/ws/PlanificacionSvcImpl.php';

  constructor(private proxyService: ProxyService) { }

  /**
   * Crea un nuevo control de actividad
   * @param controlData Datos del control a crear
   * @returns Observable con la respuesta del API
   */
  createControl(controlData: {
    caso: string,
    IdControl: number,
    idObra: number,
    obra: null,
    idUsuario: number,
    usuario: null,
    periodo: number,
    idEtapaConst: number,
    etapaConst: null,
    idSubProceso: number,
    subProceso: null,
    idAmbito: number,
    ambito: null,
    idActividad: number,
    actividad: null,
    idPeriocidad: number,
    periocidad: null,
    idCategoria: number,
    idParam: number,
    dias: null,
    fechaControl: string
  }): Observable<any> {
    console.log('Creando nuevo control:', controlData);
    return this.proxyService.post<any>(this.apiEndpoint, controlData);
  }

  /**
   * Consulta los controles existentes según filtros
   * @param queryParams Datos para filtrar la consulta
   * @returns Observable con la respuesta del API
   */
  getControls(queryParams: {
    caso: string,
    idObra: number,
    idUsuario: number,
    periodo: number
  }): Observable<any> {
    console.log('Consultando controles con parámetros:', queryParams);
    return this.proxyService.post<any>(this.apiEndpoint, queryParams);
  }

  /**
   * Actualiza los días seleccionados para un control
   * @param updateData Datos para la actualización de días
   * @returns Observable con la respuesta del API
   */
  updateControlDays(updateData: {
    caso: string,
    idControl: number,
    dias: string
  }): Observable<any> {
    console.log('Actualizando días del control:', updateData);
    return this.proxyService.post<any>(this.apiEndpoint, updateData);
  }
  
  /**
   * Obtiene las actividades para la planificación según proyecto, usuario y periodo
   * @param requestParams Parámetros para filtrar la consulta
   * @returns Observable con la respuesta del API
   */
  getActivitiesForPlanification(requestParams: {
    caso: string,
    idObra: number,
    idUsuario: number,
    periodo: number
  }): Observable<any> {
    // Mantener exactamente el mismo formato que se usaba originalmente
    console.log('Consultando actividades para planificación:', requestParams);
    return this.proxyService.post<any>(this.apiEndpoint, {
      caso: requestParams.caso,
      idObra: requestParams.idObra,
      idUsuario: requestParams.idUsuario,
      periodo: requestParams.periodo
    });
  }
  
  /**
   * Obtiene las actividades completadas para un usuario y periodo
   * @param requestParams Parámetros para filtrar la consulta
   * @returns Observable con la respuesta del API
   */
  getCompletedActivities(requestParams: {
    caso: string,
    idUsuario: number,
    periodo: number
  }): Observable<any> {
    console.log('Consultando actividades completadas:', requestParams);
    // Usamos el endpoint específico para planificaciones
    return this.proxyService.post<any>(this.planificacionApiEndpoint, {
      caso: requestParams.caso,
      IdUsuario: requestParams.idUsuario, // Mantener mayúscula en IdUsuario como en el original
      Periodo: requestParams.periodo // Mantener mayúscula en Periodo como en el original
    });
  }
}
