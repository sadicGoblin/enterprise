import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProxyService } from '../../../../../../../core/services/proxy.service';
import { 
  UsuarioRequest, 
  UsuarioResponse 
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly API_ENDPOINT = '/ws/UsuarioSvcImpl.php';

  constructor(private proxyService: ProxyService) {}

  /**
   * Obtiene la lista de usuarios
   * @returns Observable con la respuesta de la API
   */
  getUsuarios(): Observable<UsuarioResponse> {
    const requestBody: UsuarioRequest = {
      caso: 'Consultas',
      idUsuario: 0,
      usuario: null
    };

    return this.proxyService.post<UsuarioResponse>(this.API_ENDPOINT, requestBody);
  }
}
