import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
    
    let url: string;
    
    // Use different URL strategies based on environment
    if (environment.production) {
      // In production: use absolute URLs
      // Check if it's already a full URL (starts with http:// or https://)
      if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        // Already a complete URL, use as is
        url = endpoint;
      } else if (endpoint.startsWith('/ws/')) {
        // If endpoint already includes /ws/, use it with the base domain
        url = `https://inarco-ssoma.favric.cl${endpoint}`;
      } else {
        // Otherwise, construct the full URL
        url = `https://inarco-ssoma.favric.cl/ws/${endpoint}`;
      }
      console.log('%c Using absolute URL in production:', 'color: green; font-weight: bold', url);
    } else {
      // In development: use relative URL with Angular proxy
      url = endpoint;
      console.log('%c Using relative URL with Angular proxy:', 'color: blue; font-weight: bold', url);
    }
    
    // Make the HTTP request
    return this.http.post<T>(url, body, { headers }).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => error);
      })
    );
  }
}
