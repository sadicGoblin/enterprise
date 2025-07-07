import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  // Subject para notificar actualizaciones de ámbitos
  private ambitosUpdateSource = new Subject<void>();
  
  // Observable que los componentes pueden suscribirse
  ambitosUpdated$ = this.ambitosUpdateSource.asObservable();
  
  constructor() { }
  
  /**
   * Notifica a todos los componentes suscritos que los ámbitos se han actualizado
   */
  notifyAmbitosUpdate(): void {
    console.log('🔄 Notificando actualización de ámbitos a todos los componentes');
    this.ambitosUpdateSource.next();
  }
}
