import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';
import { environment } from '../../../../environments/environment';

/**
 * Interface para la solicitud de control de planificación
 */
export interface PlanificationRequest {
  caso: string;
  periodo: number;
  usuarioId?: string ;
  pendiente?: string;
}

/**
 * Interface para la respuesta del control de planificación
 * (Mantiene la misma estructura que la respuesta actual del mock)
 */
export interface PlanificationResponse {
  actividades: any[];  // Mantiene la misma estructura que los datos actuales
  ok: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlanificationService {
  // API URL usando la ruta relativa que será manejada por el proxy
  private readonly apiUrl = '/ws/PlanificacionSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Obtiene los datos de control de planificación para un período específico
   * @param periodo Período en formato YYYYMM (ejemplo: 202507)
   * @returns Observable con los datos de planificación
   */
  getControlPlanificacion(periodo: string, usuarioId: string, pendiente:string): Observable<any> {
    const request: PlanificationRequest = {
      caso: 'ControlPlanificacion',
      periodo: parseInt(periodo, 10),  // Convertir a número
      usuarioId: usuarioId,
      pendiente: pendiente
    };
    console.log(`[PlanificationService] usuarioId: ${usuarioId}`);
    console.log(`[PlanificationService] pendiente: ${pendiente}`);
    console.log(`[PlanificationService] Consultando planificación para período ${periodo} con request:`, request);
    return this.proxyService.post<any>(environment.apiBaseUrl + this.apiUrl, request);
  }
}
