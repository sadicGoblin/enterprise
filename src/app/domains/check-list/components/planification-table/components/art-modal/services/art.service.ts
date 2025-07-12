import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../../../environments/environment';

export interface ArtResponse {
  success: boolean;
  code: number;
  message: string;
  data: number;
}

@Injectable({
  providedIn: 'root'
})
export class ArtService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  /**
   * Guarda un ART en la API
   * @param artData Datos del ART en formato API
   * @returns Observable con la respuesta de la API
   */
  saveArt(artData: any): Observable<ArtResponse> {
    return this.http.post<ArtResponse>(`${this.apiUrl}/ws/ARTSvcImpl.php`, artData);
  }
}
