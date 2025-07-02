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
        <h2 class="calendar-dialog-title">Seleccionar días</h2>
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
  styles: [`
    .calendar-dialog-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0;
    }
    .calendar-dialog-header {
      padding: 10px 15px;
      border-bottom: 1px solid #eaeaea;
      background-color: #fafafa;
    }
    .calendar-dialog-title {
      margin: 0;
      font-size: 13px;
      font-weight: 400;
      color: #555;
    }
    .calendar-dialog-content {
      padding: 10px 0;
      flex: 1;
      overflow: auto;
      max-height: 450px;
    }
    .calendar-dialog-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 15px;
      gap: 8px;
      border-top: 1px solid #eaeaea;
    }
    .mat-dialog-content {
      padding: 0;
      margin: 0;
      max-height: 80vh;
      overflow-y: auto;
    }
    .mat-dialog-actions {
      padding: 8px 16px;
      margin: 0;
      border-top: 1px solid #e0e0e0;
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
