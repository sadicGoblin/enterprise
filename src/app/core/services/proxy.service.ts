import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProxyService {
  constructor(private http: HttpClient) {}

  /**
   * Makes a POST request to API endpoints
   * In development: uses Angular's built-in proxy to avoid CORS
   * In production: directly calls the full URL
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    // Standard headers for all requests
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // We'll always use the relative URL and rely on Angular's proxy
    // This completely avoids CORS issues in development
    console.log('Using relative URL with Angular proxy:', endpoint);
    
    // Let Angular's development server proxy handle the request
    return this.http.post<T>(endpoint, body, { headers }).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => error);
      })
    );
  }
}
