import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';
import { environment } from '../../../../environments/environment';

export interface CloningRequest {
  caso: 'ExisteObra' | 'ExisteUsuario';
  idObra: number;
  idUsuario: number;
  periodoOrigen: number;
  periodoDestino: number;
}

export interface CloningResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface TaskItem {
  IdControl: string;
  IdObra: string;
  Obra: string;
  IdUsuario: string;
  Usuario: string;
  Periodo: string;
  IdEtapaConst: string;
  EtapaConst: string;
  IdSubProceso: string;
  SubProceso: string;
  IdAmbito: string;
  Ambito: string;
  IdActividad: string;
  Actividad: string;
  IdPeriocidad: string;
  Periocidad: string;
  idCategoria: string;
  idParam: string;
  dias: string;
}

export interface GetControlFilterResponse {
  success: boolean;
  code: number;
  message: string;
  data: TaskItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CloningService {
  private readonly API_ENDPOINT = '/ws/ClonarSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Clone activities for all users of a project
   */
  cloneProjectActivities(
    idObra: number, 
    periodoOrigen: number, 
    periodoDestino: number
  ): Observable<CloningResponse> {
    const requestBody: CloningRequest = {
      caso: 'ExisteObra',
      idObra,
      idUsuario: 0,
      periodoOrigen,
      periodoDestino
    };

    console.log('Cloning project activities:', requestBody);
    return this.proxyService.post(this.API_ENDPOINT, requestBody);
  }

  /**
   * Clone activities for a specific user
   */
  cloneUserActivities(
    idObra: number,
    idUsuario: number,
    periodoOrigen: number, 
    periodoDestino: number
  ): Observable<CloningResponse> {
    const requestBody: CloningRequest = {
      caso: 'ExisteUsuario',
      idObra,
      idUsuario,
      periodoOrigen,
      periodoDestino
    };

    console.log('Cloning user activities:', requestBody);
    return this.proxyService.post(this.API_ENDPOINT, requestBody);
  }

  /**
   * Convert Date to YYYYMM format for API
   */
  formatPeriodForApi(date: Date): number {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return parseInt(`${year}${month}`);
  }

  /**
   * Get user tasks for preview before cloning
   */
  getUserTasks(
    idUsuario: number,
    periodo: number,
    idObra: number | null = null
  ): Observable<GetControlFilterResponse> {
    const requestBody = {
      caso: 'getControlFilter',
      idObra,
      idUsuario,
      periodo
    };

    console.log('Getting user tasks:', requestBody);
    return this.proxyService.post(environment.apiBaseUrl + this.API_ENDPOINT, requestBody);
  }

  /**
   * Clone selected tasks by their control IDs
   */
  cloneSelectedTasks(
    controlIds: string,
    periodoDestino: number
  ): Observable<CloningResponse> {
    const requestBody = {
      caso: 'ClonarControlsId',
      controlIds,
      periodoDestino
    };

    console.log('Cloning selected tasks:', requestBody);
    return this.proxyService.post(environment.apiBaseUrl + this.API_ENDPOINT, requestBody);
  }

  /**
   * Format date for display in Spanish
   */
  formatPeriodForDisplay(date: Date): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}
