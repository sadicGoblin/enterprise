import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MultiDateCalendarComponent } from './multi-date-calendar.component';

export interface CalendarDialogData {
  selectedDates: Date[];
  defaultDays?: number[]; // Días predeterminados como números (1-31)
  rowData: any; // Datos de la fila seleccionada
  controlId: number; // ID del control para actualizar
}

/**
 * Diálogo para mostrar el calendario de selección múltiple
 */
@Component({
  selector: 'app-calendar-dialog',
  template: `
    <div class="calendar-dialog-container">
      <div class="calendar-dialog-header">
        <h2 class="calendar-dialog-title">SELECCIONAR DÍAS</h2>
      </div>
      <div class="calendar-dialog-content">
        <app-multi-date-calendar
          [selectedDates]="selectedDates"
          [defaultDates]="data.defaultDays || []"
          (datesChange)="onDateSelectionChanged($event)">
        </app-multi-date-calendar>
      </div>
      <div class="calendar-dialog-actions">
        <button mat-button (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="onSave()">Guardar</button>
      </div>
    </div>
  `,
  styleUrls: [],
  styles: [`
    /* Estilo global para el contenedor del diálogo */
    ::ng-deep .mat-dialog-container {
      padding: 0 !important;
      width: 480px !important;
      height: 370px !important;
      max-width: 480px !important;
      max-height: 370px !important;
      min-width: 480px !important;
      min-height: 370px !important;
      overflow: hidden !important;
      border-radius: 4px !important;
      box-shadow: 0 3px 6px rgba(0,0,0,0.16) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    
    .calendar-dialog-container {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      height: 100% !important;
      align-items: center !important;
    }
    
    .calendar-dialog-content {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      width: 100% !important;
      height: calc(100% - 92px) !important;
      overflow: hidden !important;
    }
    
    /* Eliminados estilos duplicados */
    
    /* Título del calendario con tamaño profesional */
    ::ng-deep h2.calendar-dialog-title {
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #333 !important;
      letter-spacing: 0.5px !important;
      margin: 0 !important;
      padding: 0 !important;
      text-align: center !important;
      width: 100% !important;
    }
    
    /* Contenedor principal */
    .calendar-dialog-container {
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
      padding: 0 !important;
      width: 100% !important;
      overflow: hidden !important;
    }
    
    /* Cabecera */
    .calendar-dialog-header {
      padding: 10px 0 !important;
      border-bottom: 1px solid #e0e4eb !important;
      background-color: white !important;
      height: 40px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-bottom: 5px !important;
      width: 100% !important;
    }
    
    /* Contenido */
    .calendar-dialog-content {
      padding: 0 !important;
      overflow: hidden !important;
    }
    
    /* Footer con acciones */
    .calendar-dialog-actions {
      display: flex !important;
      justify-content: flex-end !important;
      padding: 8px 16px !important;
      background-color: white !important;
      border-top: 1px solid #e0e4eb !important;
      height: 50px !important;
      box-sizing: border-box !important;
      align-items: center !important;
      width: 100% !important;
    }
    
    /* Botones de acción */
    .calendar-dialog-actions button {
      text-transform: uppercase !important;
      font-weight: 500 !important;
      letter-spacing: 0.3px !important;
      min-width: 90px !important;
    }
    
    .calendar-dialog-actions button.mat-primary {
      background-color: #3f51b5 !important;
      color: white !important;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.15) !important;
    }
    
    /* Ajustes adicionales de botones */
    .calendar-dialog-actions button {
      font-size: 12px !important;
      padding: 0 16px !important;
      line-height: 32px !important;
      height: 36px !important;
      margin: 0 0 0 8px !important;
      border-radius: 4px !important;
    }
    
    /* Sobreescribir todos los estilos mat-dialog */
    ::ng-deep .mat-dialog-title {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    ::ng-deep .mat-dialog-content {
      margin: 0 !important;
      padding: 0 !important;
      max-height: none !important;
    }
    
    ::ng-deep .mat-dialog-actions {
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MultiDateCalendarComponent
  ]
})
export class CalendarDialogComponent {
  selectedDates: Date[] = [];
  tempSelectedDates: Date[] = [];

  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CalendarDialogData
  ) {
    // Establecer un tamaño más pequeño para el diálogo
    dialogRef.updateSize('480px', '370px');
    // Eliminar padding del diálogo
    this.dialogRef.addPanelClass('calendar-dialog-no-padding');
    // Inicializar con los días seleccionados previamente
    this.selectedDates = [...(this.data.selectedDates || [])];
    this.tempSelectedDates = [...this.selectedDates];
  }

  onDateSelectionChanged(dates: Date[]): void {
    this.tempSelectedDates = [...dates];
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Devuelve las fechas seleccionadas al componente padre
    this.dialogRef.close(this.tempSelectedDates);
  }
}
