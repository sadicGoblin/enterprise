import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BibliotecaRequest, BibliotecaResponse } from '../models/biblioteca.models';

@Injectable({
  providedIn: 'root'
})
export class BibliotecaService {
  // API URL using relative path that will be handled by the proxy
  private readonly apiUrl = '/ws/BibliotecaSvcImpl.php';

  constructor(private http: HttpClient) {}

  /**
   * Get all documents from the library API
   * @returns Observable with biblioteca data
   */
  getAllDocuments(): Observable<BibliotecaResponse> {
    const request: BibliotecaRequest = {
      caso: 'ConsultaSinDocumento',
      iDBiblioteca: 0
    };

    return this.http.post<BibliotecaResponse>(this.apiUrl, request);
  }

  /**
   * Get a specific document from the library by ID
   * @param id The document ID to fetch
   * @returns Observable with biblioteca data
   */
  getDocumentById(id: number): Observable<BibliotecaResponse> {
    const request: BibliotecaRequest = {
      caso: 'ConsultaSinDocumento',
      iDBiblioteca: id
    };

    return this.http.post<BibliotecaResponse>(this.apiUrl, request);
  }

  // Additional methods for CRUD operations can be added here
  // createDocument, updateDocument, deleteDocument, etc.
}
