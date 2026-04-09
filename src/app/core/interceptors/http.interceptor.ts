import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isDev = !environment.production;

  const safeJson = (value: unknown): unknown => {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return '[Unserializable payload]';
    }
  };

  const logRequest = () => {
    if (!isDev) return;
    // Evitar loguear headers completos (tokens) por seguridad
    const body = req.body ?? null;
    console.log('[HTTP][REQ]', {
      method: req.method,
      url: req.urlWithParams,
      payload: safeJson(body),
    });
  };

  const logResponse = (event: HttpEvent<unknown>) => {
    if (!isDev) return;
    if (event instanceof HttpResponse) {
      console.log('[HTTP][RES]', {
        url: req.urlWithParams,
        status: event.status,
        body: safeJson(event.body),
      });
    }
  };

  const logError = (error: unknown) => {
    if (!isDev) return;
    if (error instanceof HttpErrorResponse) {
      console.log('[HTTP][ERR]', {
        url: req.urlWithParams,
        status: error.status,
        message: error.message,
        error: safeJson(error.error),
      });
    } else {
      console.log('[HTTP][ERR]', { url: req.urlWithParams, error: safeJson(error) });
    }
  };

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
    logRequest();
    return next(req).pipe(
      tap((event) => logResponse(event)),
      catchError((error) => {
        logError(error);
        return throwError(() => error);
      })
    );
  }

  // Obtener token del localStorage
  const token = localStorage.getItem('authToken');

  // Si no hay token, continuar sin modificar la request
  if (!token) {
    if (isDev) {
      console.warn('[HttpInterceptor] No token found, request will proceed without Authorization header');
    }
    logRequest();
    return next(req).pipe(
      tap((event) => logResponse(event)),
      catchError((error) => {
        logError(error);
        return throwError(() => error);
      })
    );
  }

  // Clonar la request y agregar el header Authorization con el token
  const tokenReq = req.clone({
    setHeaders: {
      'Authorization': `Token ${token}`
    }
  });

  logRequest();
  
  // Manejar la respuesta y detectar errores de autenticación
  return next(tokenReq).pipe(
    tap((event) => logResponse(event)),
    catchError((error) => {
      logError(error);
      // Si es error 401 (Unauthorized) o token inválido, hacer logout automático
      if (error.status === 401) {
        if (isDev) {
          console.warn('[HttpInterceptor] Token expired or invalid, logging out...');
        }
        
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
