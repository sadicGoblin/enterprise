import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TrabajoAlturaService } from '../../services/trabajo-altura.service';
import { ElementoInspeccion } from '../../models/trabajo-altura.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface InspectionElement {
  id: string;
  description: string;
  status: 'yes' | 'no' | 'na' | null;
  apiId?: string; // ID del elemento en la API
}

@Component({
  selector: 'app-art-inspection-elements',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './art-inspection-elements.component.html',
  styleUrl: './art-inspection-elements.component.scss'
})
export class ArtInspectionElementsComponent implements OnInit {
  // Columnas a mostrar
  displayedColumns: string[] = ['description', 'yes', 'no', 'na'];
  
  // Elementos de inspección
  inspectionElements: InspectionElement[] = [];
  
  // Estado de carga
  isLoading = false;
  hasError = false;
  errorMessage = '';

  constructor(private trabajoAlturaService: TrabajoAlturaService) {}

  ngOnInit(): void {
    this.loadInspectionElements();
  }
  
  /**
   * Carga los elementos de inspección desde la API
   */
  loadInspectionElements(): void {
    this.isLoading = true;
    this.hasError = false;
    
    this.trabajoAlturaService.getElementosInspeccion()
      .pipe(
        catchError(error => {
          this.hasError = true;
          this.errorMessage = 'Error al cargar los elementos de inspección. Por favor, intente nuevamente.';
          console.error('Error al cargar elementos de inspección:', error);
          return of({ codigo: -1, glosa: 'Error', data: [] });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        console.log('Response from ART inspection elements:', response);
        if (response.data.length > 0) {
          // Mapear los datos de la API al formato del componente
          this.inspectionElements = response.data.map((item, index) => {
            // Determinar el estado basado en los valores de la API
            let status: 'yes' | 'no' | 'na' | null = null;
            if (item.si === '1') status = 'yes';
            else if (item.no === '1') status = 'no';
            else if (item.na === '1') status = 'na';
            
            return {
              id: (index + 1).toString(),
              apiId: item.idElementoInspeccionar,
              description: item.elementoInspeccionar,
              status: status
            };
          });
        } else if (response.data && response.data.length === 0) {
          this.hasError = true;
          this.errorMessage = 'No se encontraron elementos de inspección.';
        }
      });
  }

  /**
   * Actualiza el estado de un elemento de inspección
   * @param element Elemento a actualizar
   * @param status Nuevo estado ('yes', 'no', 'na')
   */
  updateElementStatus(element: InspectionElement, status: 'yes' | 'no' | 'na'): void {
    // Si ya está seleccionado el mismo estado, lo deseleccionamos
    if (element.status === status) {
      element.status = null;
    } else {
      // Si no, actualizamos al nuevo estado
      element.status = status;
    }
    
    console.log(`Elemento ${element.id} (${element.description}) actualizado a: ${element.status}`);
    
    // Preparamos los datos para enviar al backend
    // Por ahora solo actualizamos en la UI, pero dejamos el código preparado para cuando
    // se requiera la integración completa con el backend
    
    /* Descomentar cuando se requiera la integración completa
    const updateData = {
      idElementoInspeccionar: element.apiId,
      idTrabajoAltura: '0', // Este valor debe venir del contexto del formulario padre
      si: element.status === 'yes' ? '1' : '0',
      no: element.status === 'no' ? '1' : '0',
      na: element.status === 'na' ? '1' : '0'
    };
    
    // Llamada al servicio para actualizar en el backend
    this.trabajoAlturaService.updateElementoInspeccion(updateData)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar elemento:', error);
          // Si hay error, revertimos el cambio en la UI
          element.status = status === element.status ? null : element.status;
          return of({ codigo: -1, glosa: 'Error', data: [] });
        })
      )
      .subscribe(response => {
        if (response.codigo !== 0) {
          console.error('Error en la respuesta del servidor:', response.glosa);
          // Si hay error, revertimos el cambio en la UI
          element.status = status === element.status ? null : element.status;
        }
      });
    */
  }

  /**
   * Guarda la inspección completa
   */
  saveInspection(): void {
    console.log('Elementos guardados:', this.inspectionElements);
    // Aquí se podría llamar a una API para guardar los datos
  }
}
