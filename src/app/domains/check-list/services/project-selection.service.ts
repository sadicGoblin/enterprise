import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectSelectionService {
  // BehaviorSubject para almacenar y compartir el ID del proyecto seleccionado
  private selectedProjectIdSource = new BehaviorSubject<string | null>(null);
  
  // Observable que los componentes pueden suscribirse para obtener actualizaciones
  selectedProjectId$ = this.selectedProjectIdSource.asObservable();
  
  constructor() { }
  
  /**
   * Actualiza el ID del proyecto seleccionado
   * @param projectId ID del proyecto seleccionado o null si no hay selección
   */
  setSelectedProjectId(projectId: string | null): void {
    console.log('ProjectSelectionService: Setting selected project ID to', projectId);
    this.selectedProjectIdSource.next(projectId);
  }
  
  /**
   * Obtiene el valor actual del ID del proyecto seleccionado
   * @returns El ID del proyecto seleccionado o null si no hay selección
   */
  getCurrentProjectId(): string | null {
    return this.selectedProjectIdSource.getValue();
  }
}
