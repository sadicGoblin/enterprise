import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../core/services/proxy.service';

@Injectable({
  providedIn: 'root'
})
export class ControlService {
  // El endpoint para la creación de controles
  private readonly apiEndpoint = '/ws/ControlSvcImpl.php';

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
}
