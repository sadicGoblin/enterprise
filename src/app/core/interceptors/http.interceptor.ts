import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  // Lista de endpoints que NO requieren token (login y recuperar contraseña)
  const excludedEndpoints = [
    '/ws/UsuariosSvcImpl.php',  // Login endpoint
    '/ws/RecuperarPasswordSvcImpl.php'  // Recuperar contraseña endpoint
  ];

  // Verificar si la request es a un endpoint excluido
  const isExcluded = excludedEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );

  // Si es un endpoint excluido, continuar sin token
  if (isExcluded) {
    console.log('[HttpInterceptor] Skipping token for excluded endpoint:', req.url);
    return next(req);
  }

  // Obtener token del localStorage
  const token = localStorage.getItem('authToken');

  // Si no hay token, continuar sin modificar la request
  if (!token) {
    console.warn('[HttpInterceptor] No token found, request will proceed without Authorization header');
    return next(req);
  }

  // Clonar la request y agregar el header Authorization con el token
  const tokenReq = req.clone({
    setHeaders: {
      'Authorization': `Token ${token}`
    }
  });

  console.log('[HttpInterceptor] Added Authorization header to request:', req.url);
  
  // Manejar la respuesta y detectar errores de autenticación
  return next(tokenReq).pipe(
    catchError((error) => {
      // Si es error 401 (Unauthorized) o token inválido, hacer logout automático
      if (error.status === 401) {
        console.warn('[HttpInterceptor] Token expired or invalid, logging out...');
        
        // Limpiar localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userAccessType');
        localStorage.removeItem('userPosition');
        localStorage.removeItem('userCompany');
        localStorage.removeItem('userPhone');
        
        // Redirigir al login
        router.navigate(['/'], { 
          queryParams: { message: 'Sesión expirada. Por favor, inicie sesión nuevamente.' }
        });
      }
      
      return throwError(() => error);
    })
  );
};
