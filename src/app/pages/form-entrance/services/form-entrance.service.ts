import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ProxyService } from '../../../core/services/proxy.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../models/form.models';

@Injectable({
  providedIn: 'root'
})
export class FormEntranceService {
  // Token hardcoded por ahora (el cliente no necesariamente ingresa con credenciales)
  private readonly AUTH_TOKEN = 'ZmdhbGxhcmRvQGZhdnJpYy5jbA==';
  
  // Endpoint de la API
  private readonly API_ENDPOINT = '/ws/ScreensAppSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Obtiene la configuración del formulario desde la API
   * @param caso - Tipo de formulario (ej: REP_INCIDENT)
   * @param idUsuario - ID del usuario
   */
  getFormConfiguration(caso: string, idUsuario: number): Observable<ApiResponse> {
    const body = {
      caso,
      idUsuario
    };

    const fullUrl = environment.apiBaseUrl + this.API_ENDPOINT;
    console.log('[FormEntranceService] Llamando API:', fullUrl, body);
    console.log('[FormEntranceService] Token:', this.AUTH_TOKEN);

    // Usar postWithToken para enviar el token directamente en el header
    return this.proxyService.postWithToken<ApiResponse>(
      fullUrl, 
      body,
      this.AUTH_TOKEN
    ).pipe(
      tap(response => console.log('[FormEntranceService] Respuesta:', response))
    );
  }

  /**
   * Envía las respuestas del formulario
   * @param formData - Datos del formulario completado
   */
  submitForm(formData: any, userId: number = 478): Observable<any> {
    const body = {
      caso: 'INSERT',
      user: userId,
      data: formData
    };

    const fullUrl = environment.apiBaseUrl + this.API_ENDPOINT;
    console.log('[FormEntranceService] Enviando formulario:', fullUrl);
    console.log('[FormEntranceService] Body:', JSON.stringify(body, null, 2));

    return this.proxyService.postWithToken(
      fullUrl, 
      body,
      this.AUTH_TOKEN
    ).pipe(
      tap(response => console.log('[FormEntranceService] Respuesta de envío:', response))
    );
  }
}
