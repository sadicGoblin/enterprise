import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemCadenaComponent, ItemCadenaData } from './item-cadena/item-cadena.component';

export interface PasoAprobacion {
  cargo: string;
  nombre: string;
  saltado: boolean;
}

export interface ResultadoSimulacion {
  cargo: string;
  nombre: string;
  aprobado: boolean;
  razon?: string;
  rutaAprobacion: PasoAprobacion[];
}

@Component({
  selector: 'app-workflow-oc',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ItemCadenaComponent
  ],
  templateUrl: './workflow-oc.component.html',
  styleUrls: ['./workflow-oc.component.scss']
})
export class WorkflowOcComponent {

  // Propiedades para la simulación
  montoSimulacion: number | null = null;
  resultadoSimulacion: ResultadoSimulacion | null = null;

  // Datos de ejemplo para demostrar el componente
  itemsEjemplo: ItemCadenaData[] = [
    {
      cargo: 'Oficina Técnica',
      nombre: 'Bastián Rojas',
      montoMinimo: 0,
      montoMaximo: 0,
      habilitado: true
    },
    {
      cargo: 'Administrador Obra',
      nombre: 'Pablo Del Río',
      montoMinimo: 0,
      montoMaximo: 500000,
      habilitado: true
    },
    {
      cargo: 'Visitador',
      nombre: 'Carlos Mendoza',
      montoMinimo: 500001,
      montoMaximo: 2000000,
      habilitado: false
    },
    {
      cargo: 'Gerente Obra',
      nombre: 'Ana García',
      montoMinimo: 2000001,
      montoMaximo: 10000000,
      habilitado: true
    },
    {
      cargo: 'Gerente Adquisición',
      nombre: 'Alejandro Villarroel',
      montoMinimo: 10000001,
      montoMaximo: 9999999999999, // 0 significa sin límite superior
      habilitado: true
    }
  ];

  constructor() {}

  onItemChange(index: number, data: ItemCadenaData) {
    this.itemsEjemplo[index] = data;
    console.log('Item actualizado:', data);
  }

  onItemDelete(index: number) {
    if (this.itemsEjemplo.length > 1) {
      this.itemsEjemplo.splice(index, 1);
      console.log('Item eliminado en índice:', index);
    } else {
      console.log('No se puede eliminar el último elemento de la cadena');
    }
  }

  agregarNuevoItem() {
    const nuevoItem: ItemCadenaData = {
      cargo: 'Nuevo Cargo',
      nombre: 'Nuevo Nombre',
      montoMinimo: 0,
      montoMaximo: 0,
      habilitado: false
    };
    this.itemsEjemplo.push(nuevoItem);
  }

  onMontoChange() {
    // Limpiar resultado anterior cuando cambia el monto
    this.resultadoSimulacion = null;
  }

  simularOC() {
    if (!this.montoSimulacion || this.montoSimulacion <= 0) {
      return;
    }

    const monto = this.montoSimulacion;
    const rutaAprobacion: PasoAprobacion[] = [];
    let aprobadorFinal: ItemCadenaData | null = null;
    
    // Buscar el aprobador apropiado recorriendo la cadena en orden
    for (const item of this.itemsEjemplo) {
      const paso: PasoAprobacion = {
        cargo: item.cargo,
        nombre: item.nombre,
        saltado: false
      };

      // Si el item está deshabilitado, se salta
      if (!item.habilitado) {
        paso.saltado = true;
        rutaAprobacion.push(paso);
        console.log(`Saltando ${item.cargo} - ${item.nombre} (deshabilitado)`);
        continue;
      }

      // Verificar si el monto está en el rango de este aprobador
      // PRIORIDAD AL RANGO MÁXIMO: Si el monto está dentro del límite máximo, puede aprobar
      let enRango = false;
      
      // Caso especial: si montoMinimo y montoMaximo son 0, solo aprueba montos de $0
      if (item.montoMinimo === 0 && item.montoMaximo === 0) {
        enRango = monto === 0;
        console.log(`Evaluando ${item.cargo}: monto ${monto} === 0 (solo aprueba $0) = ${enRango}`);
      }
      // Si montoMaximo es 0, significa sin límite superior
      else if (item.montoMaximo === 0) {
        enRango = monto >= item.montoMinimo;
        console.log(`Evaluando ${item.cargo}: monto ${monto} >= ${item.montoMinimo} (sin límite superior) = ${enRango}`);
      }
      // Lógica de prioridad al rango máximo: si el monto está dentro del límite máximo, puede aprobar
      else {
        enRango = monto <= item.montoMaximo;
        console.log(`Evaluando ${item.cargo}: monto ${monto} <= ${item.montoMaximo} (prioridad rango máximo) = ${enRango}`);
      }
      
      rutaAprobacion.push(paso);
      
      if (enRango) {
        aprobadorFinal = item;
        console.log(`Aprobador encontrado: ${item.cargo} - ${item.nombre}`);
        break;
      } else {
        console.log(`${item.cargo} no puede aprobar este monto, continuando...`);
      }
    }

    // Generar resultado
    if (aprobadorFinal) {
      this.resultadoSimulacion = {
        cargo: aprobadorFinal.cargo,
        nombre: aprobadorFinal.nombre,
        aprobado: true,
        rutaAprobacion
      };
    } else {
      // No se encontró aprobador válido
      const ultimoItem = this.itemsEjemplo[this.itemsEjemplo.length - 1];
      this.resultadoSimulacion = {
        cargo: ultimoItem?.cargo || 'Sin Aprobador',
        nombre: ultimoItem?.nombre || 'N/A',
        aprobado: false,
        razon: 'Monto excede todos los rangos de aprobación disponibles',
        rutaAprobacion
      };
    }

    console.log('Simulación completada:', this.resultadoSimulacion);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  }

}
