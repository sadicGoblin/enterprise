import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface InspectionElement {
  id: string;
  description: string;
  status: 'yes' | 'no' | 'na' | null;
}

@Component({
  selector: 'app-art-inspection-elements',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './art-inspection-elements.component.html',
  styleUrl: './art-inspection-elements.component.scss'
})
export class ArtInspectionElementsComponent implements OnInit {
  // Columnas a mostrar
  displayedColumns: string[] = ['description', 'yes', 'no', 'na'];
  
  // Elementos de inspección predefinidos
  inspectionElements: InspectionElement[] = [
    { id: '1', description: 'Verificación de equipo de protección personal', status: null },
    { id: '2', description: 'Inspección de herramientas y equipos', status: null },
    { id: '3', description: 'Revisión de área de trabajo', status: null },
    { id: '4', description: 'Verificación de procedimientos de seguridad', status: null },
    { id: '5', description: 'Control de riesgos ambientales', status: null },
    { id: '6', description: 'Señalización de seguridad en el área', status: null },
    { id: '7', description: 'Condiciones de iluminación adecuadas', status: null },
    { id: '8', description: 'Ventilación apropiada en el espacio de trabajo', status: null },
    { id: '9', description: 'Equipos contra incendios disponibles', status: null },
    { id: '10', description: 'Vías de evacuación despejadas', status: null }
  ];

  constructor() {}

  ngOnInit(): void {
    // Inicialización del componente
    console.log('Componente de elementos de inspección inicializado');
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
      // Actualizamos al nuevo estado
      element.status = status;
    }
    console.log(`Elemento ${element.id} actualizado a estado: ${element.status}`);
  }

  /**
   * Guarda la inspección completa
   */
  saveInspection(): void {
    console.log('Elementos guardados:', this.inspectionElements);
    // Aquí se podría llamar a una API para guardar los datos
  }
}
