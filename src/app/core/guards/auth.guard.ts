import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (authService.isAuthenticated()) {
    console.log('[AuthGuard] User is authenticated, allowing access to:', state.url);
    return true;
  }

  // Si no está autenticado, redirigir al login
  console.log('[AuthGuard] User not authenticated, redirecting to login from:', state.url);
  
  // Guardar la URL que intentaba acceder para redirigir después del login
  sessionStorage.setItem('redirectUrl', state.url);
  
  // Redirigir al login
  router.navigate(['/']);
  return false;
};
