import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../../../../../core/services/proxy.service';
import { 
  TrabajoAlturaRequest, 
  TrabajoAlturaResponse,
  ElementoInspeccion
} from '../models/trabajo-altura.model';

@Injectable({
  providedIn: 'root'
})
export class TrabajoAlturaService {
  private readonly API_ENDPOINT = '/ws/TrabajoAlturaSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Obtiene los elementos de inspección para trabajo en altura
   * @returns Observable con la respuesta de la API
   */
  getElementosInspeccion(): Observable<TrabajoAlturaResponse> {
    const requestBody: TrabajoAlturaRequest = {
      caso: "ConsultaDetalle",
      idTrabajoAltura: 0,
      idControl: -1,
      dia: 0,
      idArea: 0,
      fecha: "0001-01-01T00:00:00",
      idRealizadoPor: 0,
      idRealizadoPorCargo: 0,
      RealizadoPorfecha: "0001-01-01T00:00:00",
      idRevisadoPor: 0,
      idRevisadoPorCargo: 0,
      RevisadoPorFecha: "0001-01-01T00:00:00",
      observaciones: null,
      idSubParametro: 195,
      idInspeccionadoPor: 0
    };

    return this.proxyService.post<TrabajoAlturaResponse>(this.API_ENDPOINT, requestBody);
  }
  
  /**
   * Actualiza un elemento de inspección
   * @param elementoInspeccion Datos del elemento a actualizar
   * @returns Observable con la respuesta de la API
   */
  updateElementoInspeccion(elementoInspeccion: Partial<ElementoInspeccion>): Observable<TrabajoAlturaResponse> {
    const requestBody: TrabajoAlturaRequest = {
      caso: "ActualizaDetalle",
      idTrabajoAltura: Number(elementoInspeccion.idTrabajoAltura || 0),
      idControl: -1,
      dia: 0,
      idArea: 0,
      fecha: "0001-01-01T00:00:00",
      idRealizadoPor: 0,
      idRealizadoPorCargo: 0,
      RealizadoPorfecha: "0001-01-01T00:00:00",
      idRevisadoPor: 0,
      idRevisadoPorCargo: 0,
      RevisadoPorFecha: "0001-01-01T00:00:00",
      observaciones: null,
      idSubParametro: 195,
      idInspeccionadoPor: 0
    };
    
    // Agregamos los datos del elemento de inspección
    const payload = {
      ...requestBody,
      idElementoInspeccionar: elementoInspeccion.idElementoInspeccionar,
      si: elementoInspeccion.si,
      no: elementoInspeccion.no,
      na: elementoInspeccion.na
    };

    return this.proxyService.post<TrabajoAlturaResponse>(this.API_ENDPOINT, payload);
  }
  
  /**
   * Guarda todos los elementos de inspección
   * @param elementos Lista de elementos a guardar
   * @returns Observable con la respuesta de la API
   */
  saveInspeccionElementos(elementos: Partial<ElementoInspeccion>[]): Observable<TrabajoAlturaResponse> {
    const requestBody: TrabajoAlturaRequest = {
      caso: "GuardaDetalles",
      idTrabajoAltura: 0,
      idControl: -1,
      dia: 0,
      idArea: 0,
      fecha: "0001-01-01T00:00:00",
      idRealizadoPor: 0,
      idRealizadoPorCargo: 0,
      RealizadoPorfecha: "0001-01-01T00:00:00",
      idRevisadoPor: 0,
      idRevisadoPorCargo: 0,
      RevisadoPorFecha: "0001-01-01T00:00:00",
      observaciones: null,
      idSubParametro: 195,
      idInspeccionadoPor: 0
    };
    
    // Agregamos los elementos de inspección
    const payload = {
      ...requestBody,
      elementos: elementos
    };

    return this.proxyService.post<TrabajoAlturaResponse>(this.API_ENDPOINT, payload);
  }
}
