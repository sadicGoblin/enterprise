import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface ItemCadenaData {
  cargo: string;
  nombre: string;
  montoMinimo: number;
  montoMaximo: number;
  habilitado: boolean;
}

@Component({
  selector: 'app-item-cadena',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule
  ],
  templateUrl: './item-cadena.component.html',
  styleUrls: ['./item-cadena.component.scss']
})
export class ItemCadenaComponent {
  
  @Input() data: ItemCadenaData = {
    cargo: 'Administrador Obra',
    nombre: 'Pablo Del Río',
    montoMinimo: 0,
    montoMaximo: 500000,
    habilitado: false
  };

  @Output() dataChange = new EventEmitter<ItemCadenaData>();
  @Output() deleteRequested = new EventEmitter<void>();

  constructor() {}

  onCargoChange(value: string) {
    this.data.cargo = value;
    this.emitChange();
  }

  onNombreChange(value: string) {
    this.data.nombre = value;
    this.emitChange();
  }

  onMontoMinimoChange(value: string) {
    this.data.montoMinimo = parseFloat(value) || 0;
    this.emitChange();
  }

  onMontoMaximoChange(value: string) {
    this.data.montoMaximo = parseFloat(value) || 0;
    this.emitChange();
  }

  onHabilitadoChange(value: boolean) {
    this.data.habilitado = value;
    this.emitChange();
  }

  onDelete() {
    this.deleteRequested.emit();
  }

  private emitChange() {
    this.dataChange.emit({ ...this.data });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  }
}
