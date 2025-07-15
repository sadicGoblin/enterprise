import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { LoginRequest, LoginResponse, PerfilRequest, PerfilResponse } from '../models/auth.models';
import { environment } from '../../../environments/environment';
import { ProxyService } from './proxy.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // API endpoints
  private readonly usuarioEndpoint = '/ws/UsuarioSvcImpl.php';
  private readonly perfilEndpoint = '/ws/PerfilSvcImpl.php';

  // Store user information
  private currentUserId: number | null = null;
  private userProfile: any = null;

  constructor(private http: HttpClient, private proxyService: ProxyService) { }

  /**
   * Authenticate user using the UsuarioSvcImpl API
   * @param username User's username/email
   * @param password User's password
   * @returns Observable with authentication result
   */
  login(username: string, password: string = ''): Observable<LoginResponse> {
    // For this implementation, password is not required as per your specifications
    const request: LoginRequest = {
      caso: 'Consulta',
      usuario: username
    };

    console.log(`[AuthService] Login request for user: ${username}`, request);
    return this.proxyService.post<LoginResponse>(environment.apiBaseUrl + this.usuarioEndpoint, request)
      .pipe(
        tap(response => {
          console.log('[AuthService] Login response:', response);
          
          // Handle the API response according to the new format
          // Check for success in either the new format (success) or legacy format (glosa)
          const isSuccess = (response.success === true)
          
          if (isSuccess && response.data) {
            const userData = response.data;
            console.log('[AuthService] User data:', userData);
            
            // Extract user ID from the response data array
            if (userData.IdUsuario) {
              this.currentUserId = Number(userData.IdUsuario);
              localStorage.setItem('userId', userData.IdUsuario);
              console.log('[AuthService] Stored user ID:', userData.IdUsuario);
            }
            
            // Store username and other user info
            localStorage.setItem('userName', userData.Usuario || request.usuario);
            
            // Store additional user info that might be needed later
            if (userData.Nombre) localStorage.setItem('userFullName', userData.Nombre);
            if (userData.EMail) localStorage.setItem('userEmail', userData.EMail);
            if (userData.Perfil) localStorage.setItem('userRole', userData.Perfil);
            if (userData.TipoAcceso) localStorage.setItem('userAccessType', userData.TipoAcceso);
            if (userData.Cargo) localStorage.setItem('userPosition', userData.Cargo);
            if (userData.EmpresaContratista) localStorage.setItem('userCompany', userData.EmpresaContratista);
            if (userData.NroCelular) localStorage.setItem('userPhone', userData.NroCelular);
          }
        })
      );
  }

  /**
   * Get user profile using the PerfilSvcImpl API
   * @param userId User ID to fetch profile for
   * @returns Observable with user profile data
   */
  getUserProfile(userId?: number): Observable<PerfilResponse> {
    console.log('Current userId in service:', this.currentUserId);
    console.log('UserId in localStorage:', localStorage.getItem('userId'));
    
    // Use the provided userId or the currentUserId from local storage
    const userIdFromStorage = localStorage.getItem('userId');
    const userIdToUse = userId || this.currentUserId || (userIdFromStorage ? Number(userIdFromStorage) : null);
    const userName = localStorage.getItem('userName') || '';
    
    console.log('Using userId:', userIdToUse);
    
    if (!userIdToUse && userIdToUse !== 0) {
      throw new Error('User ID is required to fetch profile');
    }

    const request: PerfilRequest = {
      caso: 'Consulta',
      idUsuario: userIdToUse,
      usuario: userName
    };

    return this.proxyService.post<PerfilResponse>(this.perfilEndpoint, request)
      .pipe(
        tap(response => {
          // Handle the API response according to the actual format it returns
          if (response.glosa === 'OK' && response.data) {
            this.userProfile = response.data;
          }
        })
      );
  }

  /**
   * Check if user is currently logged in
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('userId');
  }

  /**
   * Logout the current user
   */
  logout(): void {
    this.currentUserId = null;
    this.userProfile = null;
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    // Remove any other stored authentication data
  }
}
