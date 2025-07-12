import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../../../../../core/services/proxy.service';

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
  constructor(private proxyService: ProxyService) { }

  /**
   * Guarda un ART en la API
   * @param artData Datos del ART en formato API
   * @returns Observable con la respuesta de la API
   */
  saveArt(artData: any): Observable<ArtResponse> {
    return this.proxyService.post<ArtResponse>('/ws/ARTSvcImpl.php', artData);
  }
}
