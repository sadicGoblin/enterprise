import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { of } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { timeout } from 'rxjs/operators';
import { retry } from 'rxjs/operators';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces para la respuesta de la API
export interface HistoricalReportItem {
  idForm: string;
  IdControl: string;
  fecha: string;
  Obra: string;
  IdUsuario: string;
  Usuario: string;
  Cargo: string;
  Periodo: string;
  EtapaConst: string;
  SubProceso: string;
  Ambito: string;
  Actividad: string;
  Periocidad: string;
  idCategoria: string;
  idParam: string;
  dia: string;
  diaCompletado: string;
  tipo: string;
  sticker: string;
  estado: string;
}

export interface HistoricalReportResponse {
  count: number;
  data: HistoricalReportItem[];
  from_cache: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiBaseUrl}/ws/ReporteSvcImpl.php`;
  
  // BehaviorSubject para notificar cuando se está reintentando
  private _isRetrying$ = new BehaviorSubject<boolean>(false);
  public isRetrying$ = this._isRetrying$.asObservable();

  constructor(private http: HttpClient) { }



  /**
   * Obtiene el reporte histórico basado en un rango de fechas
   * @param startDate Fecha de inicio en formato YYYY-MM-DD
   * @param endDate Fecha de fin en formato YYYY-MM-DD
   * @returns Observable con la respuesta del reporte histórico
   */
  getHistoricalReport(reportType: string, startDate: string, endDate: string): Observable<HistoricalReportResponse> {
    
    const payload = {
      caso: 'ReporteHistorico',
      reportType: reportType,
      fecha_inicio: startDate,
      fecha_fin: endDate
    };
    console.log(this.apiUrl, payload);


    // Resetear el estado de reintento al iniciar
    this._isRetrying$.next(false);
    let attemptCount = 0;

    return this.http.post<HistoricalReportResponse>(this.apiUrl, payload)
      .pipe(
        // Establecer un timeout de 5 minutos
        timeout(300000),
        // Intentar la petición hasta 2 veces con notificación de reintento
        retry({
          count: 1,
          delay: (error, retryCount) => {
            attemptCount = retryCount;
            console.log(`Reintentando llamada al servicio (intento ${retryCount})...`);
            this._isRetrying$.next(true);
            return of(error).pipe(delay(1000)); // Esperar 1 segundo antes de reintentar
          }
        }),
        // Resetear el estado de reintento cuando la petición finaliza (éxito o error final)
        tap({
          next: () => this._isRetrying$.next(false),
          error: () => this._isRetrying$.next(false)
        }),
        // Capturar y manejar errores
        catchError(this.handleError)
      );
  }

  /**
   * Maneja los errores de las peticiones HTTP
   * @param error Error HTTP
   * @returns Observable con el error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status === 0) {
      // Error de conexión
      errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet o si el servidor está en ejecución.';
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}, mensaje: ${error.message}`;
    }
    
    console.error('Error en ReportService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Formatea una fecha a formato YYYY-MM-DD para enviar a la API
   * @param date Fecha a formatear
   * @returns Fecha formateada en string YYYY-MM-DD
   */
  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
